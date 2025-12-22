---
title: digiteco@hypervisor
description: Hypervisor QEMU/KVM
slug: digiteco-hypervisor
updatedAt: 2025-12-22T08:02:13.547Z
---
# digiteco@hypervisor

## 192.168.20.3 — Hypervisor QEMU/KVM

Ospita tutti gli host virtuali della rete 192.168.30.0/24 (DMZ). È la macchina "beefy" con risorse computazionali significative.

***

## Configurazione di Rete

### Netplan Configuration File

**File**: `/etc/netplan/01-eth.yaml`**Renderer**: networkd**Version**: 2

#### Physical Interfaces (ethernets)

| Logical Name | Physical Name | MAC Address | Purpose | Configuration |
| :----------- | :------------ | :---------- | :------ | :------------ |
| **wan** | eno1 | 6c:2b:59:aa:4f:6b | WAN external uplink | DHCP: no, Static IP: 192.168.1.254/24 |
| **eth0** | eno2 | 6c:2b:59:aa:4f:6c | Bond slave | DHCP: no, No IP |
| **eth1** | enp2s0f0 | b0:26:28:f2:3b:aa | Bond slave | DHCP: no, No IP |
| **eth2** | enp2s0f1 | b0:26:28:f2:3b:ab | Bond slave | DHCP: no, No IP |

**WAN Configuration (eno1)**:

* IP Address: 192.168.1.254/24
* Gateway4: 192.168.1.1
* DNS Servers: 8.8.8.8, 8.8.4.4
* Optional: true (interface is optional)

#### Bonding Configuration (bond0)

* **Interfaces**: eth0 (eno2), eth1 (enp2s0f0), eth2 (enp2s0f1)
* **Mode**: 802.3ad (LACP - Link Aggregation Control Protocol)
* **MII Monitor Interval**: 1ms
* **MTU**: 9000 (Jumbo Frames enabled)
* **DHCP4/DHCP6**: Disabled (no)
* **Optional**: true
* **Purpose**: High availability and load balancing for inter-VLAN communication

#### VLAN Configuration (on bond0)

**LAN VLAN**

* **Interface Name**: lan
* **VLAN ID**: 20
* **Parent Link**: bond0
* **IP Address**: 192.168.20.1/24 (gateway for LAN)
* **MTU**: 9000
* **Optional**: true
* **Purpose**: Internal server network (hosts 192.168.20.1 firewall, other physical servers)

**DMZ VLAN**

* **Interface Name**: dmz
* **VLAN ID**: 30
* **Parent Link**: bond0
* **IP Address**: 192.168.30.1/24 (gateway for DMZ)
* **MTU**: 9000
* **Optional**: true
* **Purpose**: Virtual machine network (hosts 192.168.30.80, 192.168.30.81, Windows VMs, etc.)

### Key Architecture Details

* **802.3ad LACP**: Used for bonding - provides optimal load distribution and failover
* **Jumbo Frames (9000 MTU)**: Enabled on bond0 and VLANs for performance
* **Dual gateways**: WAN gateway (192.168.1.1) and internal VLAN gateways (192.168.20.1, 192.168.30.1)
* **Optional interfaces**: All interfaces marked optional for graceful degradation if hardware fails
* **Network segmentation**: Physical separation between WAN traffic and internal/DMZ traffic

***

## Virtual Machines (Hosted on this Hypervisor)

All VMs run on the DMZ VLAN (192.168.30.0/24) and are managed via QEMU/KVM.

| IP | Type | OS | Role | Status |
| :--- | :--- | :--- | :--- | :----- |
| 192.168.30.2 | VM | Windows | Web Server, UDP Daemon, ASP, SQL Server | - |
| 192.168.30.3 | VM | Windows | FTP Server | - |
| 192.168.30.4 | VM | Linux | Mail Server (postfix), Web Server, Ecodata Service | - |
| 192.168.30.5 | VM | Windows 7 | GSM Gateway | - |
| 192.168.30.6 | VM | Windows 7 | GPRS Gateway | - |
| 192.168.30.80 | VM | Linux | IoT Hub (Mosquitto, n8n, iotbroker, OpenProject) | - |
| 192.168.30.81 | VM | Linux | Nuovo Ecodata (Docker-based, Letta Code client) | RUNNING |

***

## Hardware & Specifications

⚠️ **To be documented:**

* CPU model and core count
* RAM capacity
* Storage (disk type, capacity, partitioning)
* QEMU/KVM version and VM management tools
* Backup procedures for VMs

***

## Service Dependencies & Startup Order

⚠️ **To be documented:**

* VM boot sequence and startup order
* Inter-VM dependencies
* Storage and network dependencies