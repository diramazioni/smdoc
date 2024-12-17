---
title: guida
description: Un riferimento per le operazioni più comuni
slug: guida
updatedAt: 2024-12-16T18:38:55.855Z
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

## Altro Titolo (livello 1)

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

| colonna 1   | colonna 2                 |
| ----------- | ------------------------- |
| contenuto 1 | ![logo](/assets/logo.png) |
| Contenuto 2 | [Link](/link)             |

Updated at {% $frontmatter.updatedAt %}
