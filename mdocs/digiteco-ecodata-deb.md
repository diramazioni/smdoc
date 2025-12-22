---
title: digiteco@ecodata-deb
description: Nuovo Ecodata
slug: digiteco-ecodata-deb
updatedAt: 2025-12-22T08:03:40.498Z
---
# digiteco@ecodata-deb

## 192.168.30.81 - Nuovo Ecodata (Docker-based)

Server virtuale che ospita i container del servizio Ecodata e lo script di importazione dati.

### Flusso di dati in entrata

```
Messaggi HTTP ->                Firewall gira su HTTP 2008 (192.168.30.7)  o HTTP (192.168.30.4) a seconda del tipo di nome (apache decide)


Messaggi UDP:8000     ->   Firewall gira 8000 su Server WEB     ->      Server WEB Windows (192.168.30.2) (SErvizio UDP Daemon UDP:8000)     ->     Server Node ECODATA (192.168.30.4) ( solo se centralina inoltrata, altri messaggi si fermano prima
                                                                                                                                                                            SQL SERVER                                                                                                                                           NODE Ecodata + WWW.digiteco.it                                                                                                                           Windows ASP SERVER 2008 ( pubblicazione siti )
```

### Docker Services

| Container ID | Servizio | Path | Entry Point | Dipendenze |
| :----------- | :------- | :--- | :---------- | :--------- |
| ab91949a731c | ecodata-server-autobahn | /opt/ecodata-server-pkg | /opt/ecodata-server-pkg/pkg/autobahn/run.sh | dipende da /var/todo |
| e0337c83b306 | ecodata-server-api | /opt/ecodata-server-api | /opt/ecodata-server-api/run.sh |  |
| b8343edb6e35 | ecodata-server-rmap | /opt/ecodata-server-pkg | /opt/ecodata-server-pkg/pkg/rmap/run.sh |  |
| cd5cac6d8923 | crossbar | /opt/crossbar | /opt/crossbar/run.sh |  |
| c8b7409cfd85 | redis6 | /opt/redis | /opt/redis/redis.sh |  |

### Script di Importazione Dati

**ecodata2http** \- Importazione dati da stazioni Ecodata**Ubicazione**: `/srv/ecodata2http/`**Funzione**:Viene gestito dalla interfaccia di amministrazione su [iot.digiteco.it/ecodata](https://iot.digiteco.it/ecodata) che scrive e restituisce via api un file json di configurazione utilizzato da due programmi:

* un server http, che fa da relay dei dati inviati via UDP ad ecodata-server verso i vari servizi configurati per quella stazione (es iotbroker\_mqtt, evomatic\_http, etc) legge lo stesso file di configurazione del servizio cron
* un servizio cron, che verra disabilitato una volta che il server-http entra in funzione, che periodicamente spedisce i dati ai vari servizi

entrambi i servizi usano iotbroker per

* Interrogazione API interna di iotbroker per notifica di invio errori, dati mancanti, ultimo invio
* Invio dati via HTTP/MQTT ai vari servizi configurati