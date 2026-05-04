import socket

def check_port(ip, port):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(1)
    try:
        s.connect((ip, port))
        s.close()
        return True
    except:
        return False

for i in range(1, 255):
    ip = f"10.0.8.{i}"
    if check_port(ip, 1433):
        print(f"IP {ip} has port 1433 OPEN")
    if check_port(ip, 1434):
        print(f"IP {ip} has port 1434 OPEN")
