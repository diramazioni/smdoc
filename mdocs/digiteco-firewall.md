---
title: digiteco@firewall
description: Firewall Principale
slug: digiteco-firewall
updatedAt: 2025-12-22T08:01:39.325Z
---
# digiteco@firewall

## 192.168.20.1 — Firewall Principale

Firewall e server OpenVPN con funzione di gateway e proxy Apache per instradamento verso macchine virtuali.

***

## Configurazione di Rete

La configurazione è complessa, con **bonding per alta disponibilità** e **VLANs per segmentazione**.

### Interfacce di Rete

| Interfaccia | Tipo | Indirizzo IP | MTU | Scopo | MAC |
| :---------- | :--- | :----------- | :--- | :---- | :---: |
| **lo** | Loopback | 127.0.0.1/8, ::1/128 | - | Comunicazioni locali | - |
| **eth0, eth1, eth2** | Fisiche | Parte di bond0 | 9000 | Slave di bond0 | 8e:20:2b:8b:bc:ef |
| **bond0** | Bonded (eth0+eth1+eth2) | Nessun IP | 9000 | Backbone HA/Load balancing | 8e:20:2b:8b:bc:ef |
| **wan** | WAN | 192.168.1.254/24 + fe80::6e2b:59ff:feaa:4f6b/64 | 1500 | Interfaccia esterna/pubblica | - |
| **lan@bond0** | VLAN su bond0 | 192.168.20.1/24 + fe80::8c20:2bff:fe8b:bcef/64 | 9000 | LAN interna (server fisici) | - |
| **dmz@bond0** | VLAN su bond0 | 192.168.30.1/24 + fe80::8c20:2bff:fe8b:bcef/64 | 9000 | DMZ (macchine virtuali) | - |
| **docker0** | Bridge Docker | 172.17.0.1/16 | 1500 | Networking container Docker | - |
| **tun0** | OpenVPN Tunnel | 192.168.40.1/24 + fe80::ee79:c329:2e12:ef6d/64 | 1500 | Tunnel VPN endpoint | - |

### Architettura Dettagliata

#### Bonding per Alta Disponibilità

* **Interface**: bond0
* **Slave**: eth0, eth1, eth2
* **MTU**: 9000 (Jumbo Frames abilitati)
* **MAC Address**: 8e:20:2b:8b:bc:ef
* **Scopo**: Aggregazione di linee per ridondanza e load balancing

#### VLANs

**LAN VLAN (Internal)**

* **Interface**: lan@bond0
* **Network**: 192.168.20.0/24
* **Gateway**: 192.168.20.1
* **Host**: Server fisici (hypervisor QEMU/KVM, altri servizi)
* **MTU**: 9000

**DMZ VLAN (Virtual Machines)**

* **Interface**: dmz@bond0
* **Network**: 192.168.30.0/24
* **Gateway**: 192.168.30.1
* **Host**: Tutte le macchine virtuali (iot-deb, ecodata-deb, mail, Windows VM)
* **MTU**: 9000

#### Connettività Esterna

* **WAN Interface**: wan
* **IP Pubblico**: 192.168.1.254/24
* **MTU**: 1500
* **Scopo**: Collegamento verso Internet/rete esterna

#### OpenVPN

* **Interface**: tun0
* **IP Tunnel**: 192.168.40.1/24
* **MTU**: 1500
* **Scopo**: Remote access VPN

#### Docker Networking

* **Interface**: docker0
* **Network**: 172.17.0.1/16
* **Scopo**: Ponte di rete per container Docker

***

## Firewall & Routing (iptables)

[Regole iptables complete](files/rules) — Script bash di configurazione iptables (Marco Baldinetti, 23/06/2020)

### Reti Gestite

| Network | Name | Interfaccia | Gateway | Scopo |
| :------ | :--- | :---------- | :------ | :---- |
| 192.168.1.0/24 | HAG | wan | 192.168.1.1 | Uplink esterno/WAN |
| 192.168.20.0/24 | LAN | lan | 192.168.20.1 | Server fisici (hypervisor, servizi locali) |
| 192.168.30.0/24 | DMZ | dmz | 192.168.30.1 | Macchine virtuali (web, mail, IoT, ecodata) |
| 192.168.40.0/24 | VPN | tun0 | - | OpenVPN tunnel (accesso remoto interno) |
| 172.16.0.0/16 | VPN\_EXT | tun0 | - | Reti esterne via VPN (altri siti/filiali) |

### Architettura del Filtraggio

**Default Policy**: DROP su INPUT, OUTPUT, FORWARD (whitelist approach - **deny by default**)

**Chain Principali**:

* **bad\_tcp\_packets** — Validazione flag TCP (SYN, ACK); rifiuta SYN+ACK con state NEW
* **icmp\_packets** — Gestione ICMP (ping, type-3 error messages permesse)
* **Coppie per-interface** (es. wan-dmz, dmz-wan, lan-vpn, etc.) — Filtraggio traffico direzionale tra reti

### Port Forwarding (NAT PREROUTING WAN→DMZ)

Instaura mapping da porte WAN (192.168.1.254) a servizi DMZ:

**Webserver (192.168.30.2)**:

* UDP:8000 → 192.168.30.2:8000 (UDP daemon)

**Web2008Server (192.168.30.7)** — Server Windows 2008 (aggiunto novembre 2023):

* TCP:80, 443 → 192.168.30.7:80, 443 (HTTP/HTTPS)
* UDP:8000 → 192.168.30.7:8000 (UDP daemon)

**FTP Server (192.168.30.3)**:

* TCP:20, 21 → 192.168.30.3:20, 21 (FTP active/passive)
* TCP:22 → 192.168.30.3:22 (SFTP - aggiunto luglio 2023)

**Mail Server (192.168.30.4)** — **Porta principale di concentrazione**:

* TCP:25 → SMTP (invio)
* TCP:110 → POP3 (ricezione legacy)
* TCP:143 → IMAP (ricezione)
* TCP:443, 465 → HTTPS, SMTPS
* TCP:993, 995 → IMAPS, POP3S
* TCP:1883 → MQTT (messaggistica interna)
* TCP:2020, 2021 → FTP alternativo (per forwarding interno)
* TCP:8080 → Web API
* TCP:9000 → WebSocket
* UDP:80, 8001 → Servizi UDP alternativi

**Centralino (192.168.20.x - LAN)**:

* TCP:19443 → 192.168.20.x:443 (HTTPS proxy)

### Segmentazione con Reti

**Permessi (esempi chiave)**:

* ✅ **WAN ↔ DMZ** — Traffico inbound esterno verso VMs (basato su regole specifiche per porta/IP destinatario)
* ✅ **WAN ↔ LAN** — Traffico controllato verso server fisici (risposte a connessioni iniziate da LAN)
* ✅ **LAN ↔ DMZ** — Comunicazione bidirezionale full tra server fisici e VMs
* ✅ **VPN ↔ DMZ** — Accesso interno remote via OpenVPN
* ✅ **VPN ↔ VPN\_EXT** — Routing tra tunnel VPN locali e remoti (172.16.0.0/16)

**Vietati (default DROP)**:

* DMZ → WAN (solo risposte a connessioni iniziate)
* Reti non esplicitamente permesse

### Protezione & Sicurezza

* **IP Banning**: 212.70.149.5/24 e 45.142.120.133/24 bannati con LOG
* **Connection Tracking**: nf\_conntrack attivo per stateful inspection
* **Logging**: Traffico bloccato loggato su syslog (prefisso "chain-name: ")
* **FTP Support**: nf\_conntrack\_ftp per negoziazione porte dinamiche (PASV)

### Moduli Kernel Abilitati

```bash
modprobe ip_conntrack, nf_conntrack_ftp, ip_conntrack_ftp, ip_nat_ftp
echo "1" > /proc/sys/net/ipv4/ip_forward           # Abilita IP forwarding
echo "1" > /proc/sys/net/netfilter/nf_conntrack_helper  # FTP connection tracking
```

***

## Servizi

### OpenVPN Server

* **Port**: 1194/UDP (default)
* **Tunnel Network**: 192.168.40.0/24
* **Autenticazione**: Certificati (TLS)
* **Scopo**: Accesso remoto sicuro all'infrastruttura

### Apache Proxy

* **Scopo**: Proxy inverso per siti web
* **Instrada verso**: VMs in DMZ (es. iot.digiteco.it → 192.168.30.80)
* **Protocolli**: HTTP/HTTPS

***

## Note sulla Configurazione

✅ **Punti di forza:**

* Bonding eth0/eth1/eth2 per ridondanza
* Jumbo frames (MTU 9000) su bond0 e VLAN per performance
* Segmentazione con VLAN fra server e VMs
* OpenVPN per accesso remoto sicuro

⚠️ **Da verificare/completare:**

* Failover policy del bonding (active-backup? balance-alb?)
* Configurazione interface bond0 e VLAN (netplan? legacy ifupdown?)
* Certificati OpenVPN (scadenza, backup)
* IPv6 routing e scoping (fe80:: link-local)