#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
[PROD] vapmortarwiki 배포 스크립트 - 10.50.20.51 (vapm.sampyo.co.kr)
Next.js + PostgreSQL(pgvector) Docker 전체 배포 자동화

실행 순서:
  1. git push origin main  (로컬에서 먼저)
  2. python scripts/deploy_PROD.py

구성:
  - Docker Compose: Next.js 앱 + PostgreSQL 17 + pgvector
  - Nginx: HTTPS 리버스 프록시 (와일드카드 SSL *.sampyo.co.kr)
  - 포트: 8002 (호스트) → 3000 (컨테이너)
"""
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

import paramiko
import os
import time

# ── 앱별 변경 항목 ──────────────────────────────────────
HOST       = "10.50.20.51"
PORT       = 22
USER       = "sampyopi"
PASS       = os.environ.get("DEPLOY_PASS", "qwer!@34")
DOMAIN     = "vapm.sampyo.co.kr"
GH_TOKEN   = os.environ.get("GH_TOKEN", "")
REPO_URL   = f"https://{GH_TOKEN}@github.com/kis2255/vapmortarwiki.git" if GH_TOKEN else "https://github.com/kis2255/vapmortarwiki.git"
REPO_DIR   = f"/home/{USER}/vapmortarwiki"
APP_PORT   = 8003                           # 호스트 포트
BASE_LOCAL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# SSL 인증서 경로 (sam-workmanual에서 관리하는 와일드카드 인증서)
SSL_CERT   = "/home/sampyopi/sam-workmanual/nginx/ssl/2026/fullchain.pem"
SSL_KEY    = "/home/sampyopi/sam-workmanual/nginx/ssl/2026/2026_sampyo.co.kr_.key.pem"

# ── Nginx 설정 (HTTPS + 리버스 프록시) ─────────────────
NGINX_CONF = f"""\
# HTTP → HTTPS 리다이렉트
server {{
    listen 80;
    server_name {DOMAIN};
    return 301 https://{DOMAIN}$request_uri;
}}

# HTTPS
server {{
    listen 443 ssl;
    server_name {DOMAIN};

    # 와일드카드 인증서 (*.sampyo.co.kr)
    ssl_certificate     {SSL_CERT};
    ssl_certificate_key {SSL_KEY};
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Next.js 리버스 프록시 (SSR 전체 프록시)
    location / {{
        proxy_pass http://127.0.0.1:{APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300;
        client_max_body_size 50M;
    }}
}}
"""

# ══════════════════════════════════════════════════════════
# SSH 연결
# ══════════════════════════════════════════════════════════
def ssh_connect():
    print(f"\n[SSH] {USER}@{HOST}:{PORT} 접속 중...")
    for attempt in range(1, 4):
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(HOST, port=PORT, username=USER, password=PASS,
                           timeout=30, look_for_keys=False, allow_agent=False)
            client.get_transport().set_keepalive(20)
            print("  접속 성공")
            return client
        except Exception as e:
            print(f"  시도 {attempt}/3 실패: {e}")
            if attempt < 3:
                time.sleep(5)
    raise RuntimeError("SSH 접속 실패 - 서버 IP/비밀번호/포트 확인 필요")

# ── 명령 실행 ──────────────────────────────────────────────
def run(client, cmd, timeout=120, check=False):
    """sudo로 명령 실행"""
    safe_pass = PASS.replace("'", "'\\''")
    full_cmd = f"printf '%s\\n' '{safe_pass}' | sudo -S bash -c '{cmd}'"
    stdin, stdout, stderr = client.exec_command(full_cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    try:
        out = stdout.read().decode(errors='replace')
        err = stderr.read().decode(errors='replace')
        rc  = stdout.channel.recv_exit_status()
    except Exception as e:
        return "", str(e), -1

    def clean(text):
        return [l for l in text.strip().splitlines()
                if not any(x in l for x in ["[sudo]", "password for", "sudo:"])]

    for line in clean(out): print(f"    {line}")
    for line in clean(err): print(f"    [ERR] {line}")

    if check and rc != 0:
        raise RuntimeError(f"명령 실패 (rc={rc}): {cmd[:80]}")
    return out, err, rc

def run_as_user(client, cmd, timeout=120):
    """sudo 없이 로그인 유저 권한으로 실행"""
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    stdout.channel.settimeout(timeout)
    try:
        out = stdout.read().decode(errors='replace')
        err = stderr.read().decode(errors='replace')
        rc  = stdout.channel.recv_exit_status()
    except Exception as e:
        return "", -1
    for line in out.strip().splitlines(): print(f"    {line}")
    for line in err.strip().splitlines(): print(f"    [ERR] {line}")
    return out, rc

def ok(rc, label):
    status = "OK" if rc == 0 else f"FAIL (rc={rc})"
    print(f"  → {label}: {status}")
    return rc == 0


# ══════════════════════════════════════════════════════════
# STEP 0: SSH 보호
# ══════════════════════════════════════════════════════════
def step0_protect_ssh(client):
    print("\n" + "="*55)
    print("STEP 0: SSH 보호")
    print("="*55)

    run(client, "systemctl unmask ssh 2>/dev/null || true")
    _, _, rc = run(client, "systemctl enable ssh 2>/dev/null || systemctl enable sshd")
    ok(rc, "ssh enable")
    _, _, rc = run(client, "systemctl start ssh 2>/dev/null || systemctl start sshd")
    ok(rc, "ssh start")
    out, _, _ = run(client, "systemctl is-active ssh 2>/dev/null || systemctl is-active sshd")
    print(f"  → SSH 상태: {out.strip()}")
    print("  STEP 0 완료 ✓")


# ══════════════════════════════════════════════════════════
# STEP 1: 필수 패키지 설치
# ══════════════════════════════════════════════════════════
def step1_install_packages(client, sftp):
    print("\n" + "="*55)
    print("STEP 1: 필수 패키지 설치 확인")
    print("="*55)

    env_prefix = "DEBIAN_FRONTEND=noninteractive"

    # git
    print("\n  [1/3] git 확인...")
    out, _, _ = run(client, "git --version 2>/dev/null || echo NOT_INSTALLED")
    if "NOT_INSTALLED" in out:
        run(client, f"{env_prefix} apt-get update -y && apt-get install -y git", timeout=180)
    else:
        print(f"    이미 설치됨: {out.strip()}")

    # nginx
    print("\n  [2/3] nginx 확인...")
    out, _, _ = run(client, "nginx -v 2>&1 || echo NOT_INSTALLED")
    if "NOT_INSTALLED" in out:
        run(client, f"{env_prefix} apt-get install -y nginx", timeout=180)
        run(client, "systemctl enable nginx && systemctl start nginx")
    else:
        print(f"    이미 설치됨: {out.strip()}")

    # docker + docker compose
    print("\n  [3/3] docker 확인...")
    out, _, _ = run(client, "docker --version 2>/dev/null || echo NOT_INSTALLED")
    if "NOT_INSTALLED" in out:
        run(client, f"{env_prefix} apt-get update -y && apt-get install -y docker.io docker-compose-v2", timeout=600)
    else:
        print(f"    이미 설치됨: {out.strip()}")

    # Docker daemon.json (사내망 172.17.x.x 충돌 방지)
    daemon_conf = '{\n  "bip": "10.200.0.1/24",\n  "default-address-pools": [{"base": "10.201.0.0/16", "size": 24}]\n}\n'
    existing, _, _ = run(client, "cat /etc/docker/daemon.json 2>/dev/null || echo __MISSING__")
    if existing.strip() == daemon_conf.strip():
        ok(0, "daemon.json 이미 최신")
        client._daemon_changed = False
    else:
        print("  → daemon.json 설정...")
        run(client, "mkdir -p /etc/docker")
        with sftp.file("/tmp/docker_daemon.json", "w") as f:
            f.write(daemon_conf)
        run(client, "cp /tmp/docker_daemon.json /etc/docker/daemon.json && rm /tmp/docker_daemon.json")
        ok(0, "daemon.json 작성")
        client._daemon_changed = True

    run(client, "systemctl enable docker")
    print("\n  STEP 1 완료 ✓")


# ══════════════════════════════════════════════════════════
# STEP 2: 소스코드 + 환경설정
# ══════════════════════════════════════════════════════════
def step2_deploy_files(client, sftp):
    print("\n" + "="*55)
    print("STEP 2: 소스코드 + 환경설정")
    print("="*55)

    # ── 2-1. git clone / pull ─────────────────────────────
    print("\n  [1/3] git clone/pull...")
    out, _, _ = run(client, f"test -d {REPO_DIR}/.git && echo EXISTS || echo NEW")
    if "EXISTS" in out:
        _, rc = run_as_user(client,
            f"cd {REPO_DIR} && GIT_TERMINAL_PROMPT=0 git pull origin main",
            timeout=60)
        ok(rc, "git pull")
    else:
        run(client, f"rm -rf {REPO_DIR}")
        _, rc = run_as_user(client,
            f"GIT_TERMINAL_PROMPT=0 git clone {REPO_URL} {REPO_DIR}",
            timeout=120)
        ok(rc, "git clone")
        if rc != 0:
            raise RuntimeError("git clone 실패 - 토큰 또는 저장소명 확인 필요")

    run(client, f"chown -R {USER}:{USER} {REPO_DIR}")

    # ── 2-2. docker-compose.override.yml (네트워크 서브넷) ──
    override_conf = (
        "networks:\n"
        "  default:\n"
        "    name: vapmortarwiki-network\n"
        "    ipam:\n"
        "      config:\n"
        "        - subnet: 10.201.2.0/24\n"
    )
    with sftp.file(f"{REPO_DIR}/docker-compose.override.yml", "w") as f:
        f.write(override_conf)
    ok(0, "docker-compose.override.yml (subnet 10.201.2.0/24)")

    # ── 2-3. .env.prod 업로드 ────────────────────────────
    print("\n  [2/3] .env.prod 설정...")
    out, _, _ = run(client, f"test -f {REPO_DIR}/.env.prod && echo EXISTS || echo MISSING")
    if "MISSING" in out:
        env_path = os.path.join(BASE_LOCAL, ".env.prod")
        if not os.path.exists(env_path):
            raise FileNotFoundError(f".env.prod 파일 없음: {env_path}")
        sftp.put(env_path, f"{REPO_DIR}/.env.prod")
        print(f"    OK .env.prod 업로드 완료")
    else:
        print(f"    .env.prod 이미 존재 → 유지")

    # ── 2-4. 필요 디렉토리 생성 ──────────────────────────
    print("\n  [3/3] 디렉토리 생성...")
    run(client, f"mkdir -p {REPO_DIR}/public/uploads/pdf-pages")
    run(client, f"mkdir -p {REPO_DIR}/docker/initdb")
    ok(0, "디렉토리 준비")

    print("\n  STEP 2 완료 ✓")


# ══════════════════════════════════════════════════════════
# STEP 3: Docker 빌드 및 실행
# ══════════════════════════════════════════════════════════
def step3_docker_run(client):
    print("\n" + "="*55)
    print("STEP 3: Docker 빌드 및 실행")
    print("="*55)

    # docker 그룹에 유저 추가
    print("\n  [1/4] docker 그룹 설정...")
    run(client, f"usermod -aG docker {USER}")

    # 기존 컨테이너 정리
    print("\n  [2/4] 기존 컨테이너 정리...")
    run(client, f"cd {REPO_DIR} && docker compose down --remove-orphans 2>/dev/null || true")
    run(client, "docker network rm vapmortarwiki-network 2>/dev/null || true")

    # Docker 재시작 (daemon.json 변경된 경우만)
    print("\n  [3/4] Docker 재시작 확인...")
    daemon_changed = getattr(client, '_daemon_changed', True)
    if not daemon_changed:
        print("  → daemon.json 변경 없음 — Docker 재시작 건너뜀")
    else:
        print("  → daemon.json 변경됨 — Docker 재시작 중...")
        run(client, "iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT 2>/dev/null || true")
        _, _, rc = run(client, "systemctl restart docker")
        time.sleep(5)
        run(client, "iptables -I INPUT 1 -p tcp --dport 22 -j ACCEPT 2>/dev/null || true")
        ok(rc, "Docker 재시작")
        if rc != 0:
            run(client, "journalctl -u docker --no-pager -n 20 2>&1 || true")
            raise RuntimeError("Docker 재시작 실패")

    # docker compose up --build
    print("\n  [4/4] Docker 빌드 및 실행 (Next.js 빌드 포함, 시간 소요)...")
    _, _, rc = run(client,
        f"cd {REPO_DIR} && docker compose up -d --build",
        timeout=900)
    if not ok(rc, "docker compose up --build"):
        run(client, f"cd {REPO_DIR} && docker compose logs --tail=50")
        raise RuntimeError("Docker 실행 실패")

    # 컨테이너 기동 대기 (DB 초기화 + Next.js 기동)
    print("\n  컨테이너 기동 대기 (60초)...")
    for i in range(6):
        time.sleep(10)
        print(f"    {(i+1)*10}초...")

    # 컨테이너 상태 확인
    print("\n  [컨테이너 상태]")
    run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep vapm")

    # 헬스체크
    out, _, _ = run(client,
        f"curl -sf --max-time 10 http://localhost:{APP_PORT} | head -1 || echo 'not ready'")
    print(f"  앱 헬스체크: {'OK' if '<!doctype' in out.lower() or '<html' in out.lower() else out.strip()}")

    print("\n  STEP 3 완료 ✓")


# ══════════════════════════════════════════════════════════
# STEP 4: Nginx 설정 (HTTPS)
# ══════════════════════════════════════════════════════════
def step4_nginx(client, sftp):
    print("\n" + "="*55)
    print("STEP 4: Nginx 설정 (HTTPS)")
    print("="*55)

    # SSL 인증서 존재 확인
    print("\n  [1/4] SSL 인증서 확인...")
    out, _, _ = run(client, f"test -f {SSL_CERT} && echo EXISTS || echo MISSING")
    if "MISSING" in out:
        print(f"    ⚠ SSL 인증서 없음: {SSL_CERT}")
        print(f"    → HTTP 전용으로 설정합니다 (추후 SSL 적용 필요)")
        # HTTP 전용 설정으로 대체
        http_only_conf = f"""\
server {{
    listen 80;
    server_name {DOMAIN};

    location / {{
        proxy_pass http://127.0.0.1:{APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300;
        client_max_body_size 50M;
    }}
}}
"""
        with sftp.file(f"/tmp/{DOMAIN}.conf", "w") as f:
            f.write(http_only_conf)
    else:
        print(f"    OK SSL 인증서 확인됨")
        with sftp.file(f"/tmp/{DOMAIN}.conf", "w") as f:
            f.write(NGINX_CONF)

    # 설정 파일 복사
    print("\n  [2/4] Nginx 설정 파일 작성...")
    run(client, f"cp /tmp/{DOMAIN}.conf /etc/nginx/sites-available/{DOMAIN}")
    run(client, f"rm -f /tmp/{DOMAIN}.conf")
    ok(0, "설정 파일 복사")

    # sites-enabled 링크
    print("\n  [3/4] sites-enabled 설정...")
    run(client, f"ln -sf /etc/nginx/sites-available/{DOMAIN} /etc/nginx/sites-enabled/{DOMAIN}")
    ok(0, "sites-enabled 링크")

    # Nginx 재시작
    print("\n  [4/4] Nginx 재시작...")
    out, err, rc = run(client, "nginx -t 2>&1 || true")
    if "successful" in out or "successful" in err or rc == 0:
        _, _, rc2 = run(client, "systemctl reload nginx")
        ok(rc2, "nginx reload")
        if rc2 != 0:
            raise RuntimeError("Nginx 재시작 실패")
    else:
        print(f"    Nginx 설정 오류 발생")
        run(client, "nginx -t 2>&1 || true")
        raise RuntimeError("Nginx 설정 오류")

    print("\n  STEP 4 완료 ✓")


# ══════════════════════════════════════════════════════════
# STEP 5: Prisma 마이그레이션 + 시드 데이터
# ══════════════════════════════════════════════════════════
def step5_db_setup(client):
    print("\n" + "="*55)
    print("STEP 5: DB 스키마 + 시드 데이터")
    print("="*55)

    # 앱 컨테이너 내에서 Prisma db push 실행
    print("\n  [1/2] Prisma 스키마 동기화...")
    _, _, rc = run(client,
        "docker exec vapmortarwiki-app npx prisma db push --skip-generate 2>&1 || true",
        timeout=60)
    ok(rc, "prisma db push")

    # pgvector 확장 확인
    print("\n  [2/2] pgvector 확인...")
    out, _, _ = run(client,
        "docker exec vapmortarwiki-db psql -U vapmwiki -d vapmortarwiki -c \"SELECT extname, extversion FROM pg_extension WHERE extname='vector';\"")
    print(f"    {out.strip()}")

    print("\n  STEP 5 완료 ✓")


# ══════════════════════════════════════════════════════════
# STEP 6: 최종 확인
# ══════════════════════════════════════════════════════════
def step6_final_check(client):
    print("\n" + "="*55)
    print("STEP 6: 최종 확인")
    print("="*55)

    print("\n  [컨테이너]")
    run(client, "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep vapm")

    print("\n  [서비스 상태]")
    out, _, _ = run(client, "systemctl is-active nginx")
    print(f"    nginx : {out.strip()}")
    out, _, _ = run(client, "systemctl is-active docker")
    print(f"    docker: {out.strip()}")

    print("\n  [메모리]")
    out, _, _ = run(client, "free -h | grep -E 'Mem|Swap'")
    for l in out.strip().splitlines(): print(f"    {l}")

    print("\n  [헬스체크]")
    out, _, _ = run(client,
        f"curl -sf --max-time 10 http://localhost:{APP_PORT}/api/products | head -1 || echo 'not ready'")
    is_ok = "code" in out.lower() or "[" in out
    print(f"    API (/api/products): {'OK' if is_ok else out.strip()[:100]}")

    out, _, _ = run(client,
        f"curl -sf --max-time 10 http://localhost:{APP_PORT} | grep -o '<title>[^<]*</title>' || echo 'not ready'")
    print(f"    페이지: {out.strip()}")

    # DB 테이블 건수
    print("\n  [DB 현황]")
    run(client,
        'docker exec vapmortarwiki-db psql -U vapmwiki -d vapmortarwiki -c '
        '"SELECT count(*) as products FROM products;" 2>/dev/null')
    run(client,
        'docker exec vapmortarwiki-db psql -U vapmwiki -d vapmortarwiki -c '
        '"SELECT count(*) as articles FROM articles;" 2>/dev/null')

    print(f"\n  ┌───────────────────────────────────────────────┐")
    print(f"  │  서비스 (내부) : http://{HOST}:{APP_PORT}       │")
    print(f"  │  서비스 (HTTPS): https://{DOMAIN}    │")
    print(f"  │  서비스 (HTTP) : http://{DOMAIN}     │")
    print(f"  └───────────────────────────────────────────────┘")
    print("\n  STEP 6 완료 ✓")


# ══════════════════════════════════════════════════════════
# 메인
# ══════════════════════════════════════════════════════════
def main():
    print("=" * 55)
    print("  [PROD] vapmortarwiki 배포 시작")
    print(f"  서버  : {HOST}")
    print(f"  도메인: {DOMAIN}")
    print(f"  포트  : {APP_PORT}")
    print("=" * 55)

    client = ssh_connect()
    sftp   = client.open_sftp()
    try:
        step0_protect_ssh(client)           # SSH 보호
        step1_install_packages(client, sftp) # git, nginx, docker
        step2_deploy_files(client, sftp)    # 소스코드 + .env.prod
        step3_docker_run(client)            # Docker 빌드 + 실행
        step4_nginx(client, sftp)           # Nginx HTTPS 설정
        step5_db_setup(client)              # Prisma + pgvector 확인
        step6_final_check(client)           # 최종 헬스체크

        print("\n" + "=" * 55)
        print("  [PROD] vapmortarwiki 배포 완료 ✓")
        print("=" * 55)
    except Exception as e:
        print(f"\n  [ERROR] 배포 중단: {e}")
        sys.exit(1)
    finally:
        sftp.close()
        client.close()

if __name__ == "__main__":
    main()
