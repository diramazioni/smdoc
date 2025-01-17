---
title: guida
description: Un riferimento per le operazioni più comuni
slug: guida
updatedAt: 2025-01-15T12:58:49.430Z
---
# {% $frontmatter.title %}

#### {% $frontmatter.description %}

Prova di testo semplice [con un link](/home)

# callout

{% callout color="blue" %}
Testo evidenziato in blue [con un link](/home)
{% /callout %}

{% callout color="green" %}
Testo evidenziato in verde [con un link](/home)
{% /callout %}

{% callout color="yellow" %}
Testo evidenziato in giallo [con un link](/home)
{% /callout %}

{% callout color="red" %}
Testo evidenziato in rosso [con un link](/home)
{% /callout %}

{% callout color="purple" %}
Testo evidenziato in viola [con un link](/home)
{% /callout %}

# drop

{% drop color="blue" title="Titolo del drop" %}

Contenuto

* A
    * B
    * C
        * D

{% /drop %}

{% drop open="true" color="purple" title="Titolo 2 " %}

Contenuto

* A
    * B
    * C
        * D

{% /drop %}

# spacer

### crea uno spazio tra le righe

fare tanti invio non serve
{% spacer %}
Testo interno opzionale
{% /spacer %}
Riga sotto
{% spacer h="100"%}
{% /spacer %}
spazio sotto 100

# Columns

## Organizza ill contenuto in più colonne

{% cols %}
{% col w="20" %}

### Sidebar

Navigation content here
{% /col %}

{% col w="70" %}

### Main Content

Main content goes here
{% /col %}
{% /cols %}

***

# Image

## cambia le dimensione dell'immagine

si può specificare la larghezza e/o l'altezza in maniera opzionale
{% image width="500px" align="center" %}
![1.00](/assets/telecamera_1.jpg)
{% /image %}

# Gallery

## mostra più immagini in una galleria

{% gallery delay=2000 height="600px" %}
![1.00](/assets/sulzano_1.jpg)
![1.00](/assets/sulzano_3.jpg)
{% /gallery %}

## Titolo e Sottotitoli (livello 1)

## sottotitolo (livello 2)

### **sotto** *inclinato* (livello 3)

#### sotto sotto (livello 4)

##### sotto (livello 5)

###### sotto (livello 6)

Testo normale

**Grassetto** ***Inclinato***

*solo inclinato*

*~~barrato~~*

# Tabella

| colonna 1 | colonna 2 |
| --------- | --------- |
| contenuto 1 | ![logo](/assets/logo.png) |
| Contenuto 2 | [Link](/link) |

Updated at {% $frontmatter.updatedAt %}