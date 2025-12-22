---
title: Server e funzioni
description: undefined
slug: server-e-funzioni
updatedAt: 2025-12-22T08:26:50.586Z
---
# Server e funzioni

| *IP*          | HOSTNAME                             | *VIRT* | *DESCR*                                          | *OS*  |
| :------------ | :----------------------------------- | :----- | :----------------------------------------------- | :---- |
| 192.168.20.1  | [firewall](/digiteco-firewall)       | NO     | Firewall (iptables) + OpenVPN server             | LINUX |
| 192.168.20.3  | [hypervisor](/digiteco-hypervisor)   | NO     | Hypervisor QEMU/KVM - macchine virtuali          | LINUX |
| 192.168.30.80 | [iot-deb](/digiteco-iot-deb)         | SI     | IoT Hub: Mosquitto, n8n, iotbroker, OpenProject  | LINUX |
| 192.168.30.81 | [ecodata-deb](/digiteco-ecodata-deb) | SI     | Nuovo Ecodata (Docker)                           | LINUX |
| 192.168.30.2  | win-udp                              | SI     | Web Server  /  UDPDaemon privato, ASP, SQLServer | WIN   |
| 192.168.30.3  | win-ftp                              | SI     | FTP                                              | WIN   |
| 192.168.30.4  | [mail](/digiteco-mail)               | SI     | Mail / WEB Server / Servizio Ecodata ecc…        | LINUX |
| 192.168.30.5  | win-gsm                              | SI     | GSM                                              | WIN7  |
| 192.168.30.6  | win-gprs                             | SI     | GPRS                                             | WIN7  |

***

