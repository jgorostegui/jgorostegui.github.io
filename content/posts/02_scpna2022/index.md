---
title: "Pamplona Software Crafters 2022 y el coste basal del código"
date: 2022-06-29T00:00:00+00:00
draft: false
toc: false

resources:
- name: "featured-image"
  src: "scpna_banner.jpeg"
- name: "featured-image-preview"
  src: "scpna_banner.jpeg"

lightgallery: true

tags: ["software", "Conference"]

---

Después de dos años sin [Pamplona Software Crafters](https://pamplonaswcraft.com/), tocaba un evento por todo lo alto. Las ganas eran enormes, sobre todo para ir volviendo a esa normalidad de acudir a ferias y eventos, que es sin duda una costumbre saludable. Cada evento para con su fin, dicho sea de paso. 

Acudí junto con [@jbraz95](https://twitter.com/jbraz95), [@Sr_Aburrido](https://twitter.com/Sr_Aburrido), [@raquelbars](https://twitter.com/raquelbars) y [@jruiza](https://es.linkedin.com/in/jruiza) por parte de [@veridas](https://twitter.com/Veridas), pero no me puedo olvidar a los organizadores del evento y ala gente de [@540deg](https://twitter.com/540deg), entre los cuales no puedo dejar de mencionar a [@javi_gut95](https://twitter.com/javi_gut95), que cumplía años el fin de semana de  la conferencia. Todos ellos han contribuido a la creación de un evento que  siempre estuvo por encima de las expectativas.

Soy consciente de que me voy a dejar un sinfín de anécdotas por contar, pero partiendo de las notas que fui tomando a ratos, en este artículo voy a hacer memoria y a hacer hincapié en los momentos  que más me llegaron.

El jueves, antes de incluso comenzar la conferencia, conversando con los compañeros de [@AudienseCo](https://twitter.com/AudienseCo) salió el tema de la adopción del pair programming en los equipos de desarrollo. A mi me encanta ver esas iniciativas a nivel colectivo. Las ventajas más notorias, entre otras, son el training continuo y la eliminación de silos o mejor intercambio de conocimientos. La verdad que en equipos donde la brecha entre seniors y juniors es manifiesta, lo veo una práctica muy atractiva y sencilla para la mentorización.

En la primera presentación y una de las que más me gustó a mi, fue la de [@fdiazgarrido](https://twitter.com/fdiazgarrido) sobre y XP en entornos altamente operativos. Los mensajes transmitidos fueron similares a los que ya se escuchan en otras charlas de esta índole, pero matizando de forma sutil y con un trasfondo que de verdad me gustó, en cómo el entorno y ciertas prácticas tienen un impacto en la calidad de vida del desarrollador. Al margen del [triángulo de la gestión de proyectos](https://www.pmi.org/learning/library/beyond-iron-triangle-year-zero-6381), me gustó la mención al _costé basal del código_. Para los que, como yo, lo primero que nos viene a la cabeza, le hemos dedicado unas horas al fitness y a la nutrición, es fácil entenderlo de forma análoga a la tasa metabólica basal que tiene el cuerpo. Para que os hagáis una idea, el cuerpo necesita  X calorías simplemente para sobrevivir, es decir para realizar las funciones básicas como respirar, latir el corazón, etc. En el código, por la simple existencia del mismo, también existe un coste inicial o de base.  El desarrollo final que necesita el cliente se va construyendo a partir de la misma.

Esto se produce por múltiples razones, entre otras:

* Por la necesidad de mantener el conocimiento de ese código (si el _maintainer_ de ese código se va a otro proyecto o deja la empresa) es necesario que eso se traslada. Esto aplica también para nuevos miembros de los equipos.
* Nuevas prácticas de desarrollo, dependencias, agujeros de seguridad, coherencia con el resto de códigos del _portfolio_ de productos.

Esto además puede incrementarse de forma exponencial, si hay un lenguaje o librería que es deprecada, entre otros.

Hablando de producto, [@jrubr](https://twitter.com/jrubr) comentó el artículo de Ryan Singer, _[Options not Roadmaps](https://m.signalvnoise.com/options-not-roadmaps/)_ que me parece super interesante. Al final, como se comenta en el artículo, cuando se tiene un _commitment_ con algo que per se tiene incertidumbre, se generan unas expectativas al respecto, que en caso de no cumplirse acaban afectando al desarrollador (por no cumplir). Si bien es cierto, esto dependerá siempre de cómo se interactúa y el tipo de cliente, etc. En el mundo real, este siempre desea un roadmap, quiere y tiene expectativas con respecto al producto. Aquí es importante mantener un equilibrio entre esas _features_ que se van a construir siempre, y _todas_ las peticiones que van llegando.

Continuando con alguna conversación de producto, a raíz de la charla orientada a Product Managers, [@MartaMans0](https://twitter.com/MartaMans0) me recomendó el libro [Escaping the Build Trap (Melisa Perri)](https://www.amazon.com/Escaping-Build-Trap-Effective-Management/dp/149197379X). Ahora mismo estoy terminando [The Manager's Path](https://www.amazon.com/Managers-Path-Leaders-Navigating-Growth/dp/1491973897), luego me pondré con él. Luego en otra charla salió también el de [The 7 Habits of Highly Effective People](https://www.amazon.com/Habits-Highly-Effective-People-Powerful/dp/1982137274/ref=sr_1_1?crid=3731IFTJD9SH0&keywords=7+habits+of+highly+effective+people&qid=1656501362&s=books&sprefix=7+habits%2Cstripbooks-intl-ship%2C332&sr=1-1).

Por otro lado, en el taller de [@MaitaneItoiz](https://twitter.com/MaitaneItoiz)  de example mapping hicimos unos ejemplos de casos reales, en grupos para entender ejemplos. La verdad que me pareció muy aplicable siempre que estén incluidos parte de negocio a la hora de definir las historias de usuario. En el taller realizamos grupos pequeños como si fuesen meetings de los _three Amigos,_ que incluye un analista de negocios, un especialista en calidad y un desarrollador.

Ya en la charla de _developer experience_ de [@msanjuan](https://twitter.com/msanjuan), se habló desde el proceso de onboarding, incluyendo automatizaciones para configurar equipos, a la documentación que tienen los equipos y como unificar esto puede reducir silos en la empresa. En mi caso particular no suelo tener necesidad de esto, ya que tengo unos tengo unos [dotifiles](https://dotfiles.github.io/) configurados que se instalan en todos mis equipos.

Otra herramienta que me pareció sugerente, aún cuando a raíz de la pandemia y el teletrabajo se haya escrito de forma considerable acerca del tema, fue [donut](https://www.donut.com/), que permite fomentar la colaboración y comunidad creando conversaciones aleatorias, no con miras a hablar de trabajo sino para hablar de lo divino y lo humano y pudiendo conectar con gente de otras áreas que podrías no conocer si no se habilitan los mecanismos para ello. Me suelen gustar este tipo de ideas verlas en forma de productos, ya que confirman de cierta manera ese nuevo negocio generado a raíz del teletrabajo. 

En lo que respecta a la documentación, me llamó muchísimo el combo de [gatsby](https://github.com/gatsbyjs/gatsby) (+plugins) para crear una documentación unificada, evolucionando sobre [mkdocs](https://github.com/mkdocs/mkdocs) y viendo como se puede quedar justo cuando intentas escalarlo más allá y hacerlo como un portal de documentación transversal y unificada para todas las áreas de la empresa, algo que evita silos y fomenta la transparencia.

Otra conferencia que me gustó personalmente mucho, fue la de antidogmas, por parte de [@msanjuan](https://twitter.com/msanjuan)  y [@flipper83](https://twitter.com/flipper83). En esta se dilucidaban los ya conocidos dogmas en torno al software. Estos dogmas, muchas veces promovidos por ciertas personas de gran relevancia en el mundo del software, hacen que X metodología/tecnología/framework sea superior a los demás sin entender el _rationale_ que hay debajo. La charla hablaba de como convertir esto en un framework para el ingeniero, ser capaz como ingeniero sustentar ambas posturas (i.e. TDD si/no). Para transmitir el mensaje ambos estuvieron debatiendo varios temas conocidos, donde a cada uno de los dos le tocaba defender una postura.

Mientras he escrito esto me han venido a la mente más conversaciones que podría citar, pero creo que ya me he extendido bastante. De hecho, una vez terminada la conferencia, y ya habiendo pasado unos días, me pesa, como en este tipo de eventos, no haber conocido a más gente, interactuado más e incluso haber intervenido en muchas ocasiones que me he mostrado dubitativo. Entiendo que eso forma parte de mi personalidad ^^
