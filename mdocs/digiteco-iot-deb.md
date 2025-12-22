---
title: digiteco@iot-deb
description: IoT e webserver
slug: digiteco-iot-deb
updatedAt: 2025-12-22T08:03:04.474Z
---
# digiteco@iot-deb

## 192.168.30.80 - IoT e Webserver

Server virtuale che funge da hub centrale per la raccolta dati IoT, automazioni e visualizzazione.

### Mosquitto MQTT Broker

Il broker principale per i messaggi MQTT da sensori e dispositivi IoT.

| Porta | Tipo di Client | Autenticazione | Note |
| :---- | :------------- | :------------- | :--- |
| 8883 | Client esterni | PSK (pre-shared key) | Connessioni esterne via TLS |
| 8882 | n8n workflow engine | Password | Comunicazione interna con workflows |
| 1883 | mqtt\_logger | Nessuna (localhost only) | Solo connessioni locali |

**Persistenza Database**: Attualmente disabilitata - da esplorare in futuro come opzione di robustezza.

### n8n - Workflow Engine (Docker)

Automazione dei flussi di lavoro, principalmente per integrazioni WhatsApp e monitoraggio.**Ubicazione script**: `/home/es/web/n8n` (contiene script per aggiornamento, stop, start)**Workflow Principali**:

* Ricezione messaggi WhatsApp in ingresso → interrogazione API interne di iotbroker
* Monitoraggio messaggi MQTT in ingresso → invio allarmi via WhatsApp (consultando API di iotbroker) se condizioni soddisfatte

**Storage Docker**: `-v n8n\_data:/home/node/.n8n`

### IoT Broker - Hub Centrale dei Dati

**Ubicazione**: `/home/es/web/digiteco`Piattaforma centrale per la raccolta dati IoT, visualizzazione e gestione allarmi.

### Backend (Python)

* Client MQTT asincrono (ascolto sulla porta 1883 di Mosquitto)
* Interpretazione messaggi MQTT → scrittura su database PostgreSQL
* Server WebSocket per comunicazione real-time con frontend
* ORM: Prisma per modelli e migrazioni database

### Frontend (Svelte 5)

Visualizzazione real-time e gestione della piattaforma.

* Visualizzazione dati sensori su mappa, grafici e tabelle dettagliate
* Gestione dispositivi e utenti
* Interfaccia di configurazione allarmi
* Report e analytics dati
* **Stack tecnologico**: Tailwind 4 (CSS), shadcn-svelte (UI), Layerchart (grafici), Tabulator (tabelle), Sharp (gestione immagini webcam)
* **Export**: Supporto XLS/CSV

### Script di Supporto

* **ecodata2http**: (eseguito su 192.168.30.81) Importazione dati da servizio ecodata → interrogazione API di iotbroker → invio dati via HTTP a servizio ecodata con periodicità configurabile
* **cam\_download.py**: Download feed webcam → creazione video → upload su S3/Cloudflare (salvataggio metadati via API iotbroker)

### WebServer Statici (pm2)

Hosting siti statici e servizi web leggeri.**Host**: `iot.digiteco.it`
**Configurazione**: `/conf/pm2` (file ecosystem per pm2)

### OpenProject (Docker)

Gestione progetti.**URL**: `op.digiteco.it`
**Storage Docker**: (TBD)

### Database & Persistenza su 192.168.30.80

| Servizio | Database | Ubicazione | Stato Backup | Note |
| :------- | :------- | :--------- | :----------- | :--- |
| iotbroker | PostgreSQL | Path standard | ⚠️ **NESSUNO - DA IMPLEMENTARE** | Dati critici sensori + configurazioni |
| n8n | File/Volume | `/home/node/.n8n` | ⚠️ Verificare | Workflows e configurazioni |
| cam\_download.py | Salvo via API iotbroker | Database iotbroker | gestito da iotbroker | Metadata video webcam |
| openproject | TBD | TBD | TBD |  |

### Dipendenze Servizi (ordine di avvio)

1. **Mosquitto** (dependency base)
2. **iotbroker** (dipende da Mosquitto per MQTT)
3. **n8n** (dipende indirettamente da iotbroker - interroga API)
4. **pm2 services** e **OpenProject** (indipendenti)

### Flusso Dati IoT (192.168.30.80)

```
Dispositivi IoT esterni
    ↓ (PSK/TLS porta 8883)
Mosquitto MQTT Broker
    ├→ (porta 1883 localhost) → mqtt_logger → iotbroker backend
    ├→ (porta 8882 password) → n8n → (API) → iotbroker backend
    └→ Messaggi persistenti
    
iotbroker backend (Python + PostgreSQL)
    ├→ WebSocket → Frontend Svelte
    ├→ API REST → n8n, ecodata2http, cam_download.py
    └→ Database PostgreSQL
```