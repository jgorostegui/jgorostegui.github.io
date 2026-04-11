---
title: "MLOps (Machine Learning Operations), my take on the consolidation of this field"
date: 2022-06-06
description: "An overview of MLOps and the consolidation of machine learning operations as a discipline."
image: "./mlops_pipeline_diagram.png"
tags: ["ML", "MLOps", "Machine Learning", "AI", "Software", "DevOps"]
authors: ["josu-gorostegui"]
---

As my first article on Medium as a software engineer with a background in the fields of Machine Learning (ML) and Artificial Intelligence (AI), it was clear to me at the outset that my first publication had to be about MLOps. Travelling back in time, we need to go back to the origins of DevOps to understand how MLOps is an extension of DevOps adding machine-learning assets to the mix. In fact, in a world that is changing at an ever-increasing pace, the importance of DevOps in software teams has undergone an enormous increase. It represents an organisational approach to application lifecycle management and streamlines the process of building, testing and deploying new code into a production environment. In other words, DevOps represents a cultural movement that aims to increase collaboration, communication and transparency across SW engineering teams, operations and business teams.

![](https://miro.medium.com/max/1400/0*jfbEXwRyKAGm-DJN)

*Figure 1: Machine Learning Development Life Cycle Process.*

However, what about companies building modern applications using machine learning? Applied to the companies where ML is the core of the product stack, embracing this will become unavoidable in the following years. Andrew NG compared the traditional software with AI software teams in his brief [chat about MLOps](https://youtu.be/06-AZXmwHjo), and his [data-centric](https://datacentricai.org/) approach to the problem, which consists of focusing on the datasets to improve the accuracy of the AI/ML system.

Pragmatically, the difference is that the ML changes engineering from a deterministic process to a **probabilistic and statistical one**. Thus, one of the most relevant aspects resides in **high-quality data throughout the entire life cycle** and providing the highest quality on all the infrastructure, reducing the uncertainty added by ML as much as possible. This rationale leads to understanding the model as a product that comes directly from the data, giving more importance to data quality. Putting in more traditional software terms, ML models can be conceived as objects *compiled from data*. Although there is a summary of the most relevant open-source solutions later in the article, MLOps is not a set of tools that data scientists use for their experimentation. It addresses all the issues to consider to maintain an ML-based product and advocates for unification, automation and monitoring to deploy production-ready ML products. It's not hard to remember the siloed software engineering of the 1990s that needed months between releases and is now capable of doing it in minutes. Some challenges are present to have a reliable delivery of ML products effectively.

## A deeper look at MLOps

MLOps can be thought of as *DevOps for machine learning*. Consider the following remark by [SIG MLOps](https://github.com/cdfoundation/sig-mlops/blob/master/roadmap/2021/MLOpsRoadmap2021.md):

> An optimal MLOps experience [as] one where Machine Learning assets are treated consistently with all other software assets within a CI/CD environment. Machine Learning models can be deployed alongside the services that wrap them and the services that consume them as part of a unified release process.

This trend comes then to combine operational know-how with Machine Learning and data science knowledge. The **mission** is to reduce technical friction to get the model from an idea into production in the shortest possible time to market with as little risk as possible.

In addition, testing does not only involve **unit and integration testing**. It also adds validation pipelines with specific testing data before training and promoting a model onto production. A/B testing, which implies testing two models on production is also a recurrent option. In this type of test, input requests are split between the two models to later review and verify whether the laboratory metrics have been satisfied. Lastly, deployment is not as easy as deploying the ML model as a prediction service because there are many scenarios where training models are frequent.

![](https://miro.medium.com/max/1400/0*qU4nRpYpy0xLVUa6)

*Figure 2: ML code lost in an ocean of ML components and activities. Adapted from "Hidden Technical Debt in Machine Learning Systems", NeurIPS 2015*

Contrary to popular belief, all these subsystems represent a small fraction of ML code, illustrated in the figure above. Moreover, the productionalization in the MLOps requires lots of *plumbing*, as mentioned in the article from Twitter engineers about their [mining infrastructure](https://www.kdd.org/exploration_files/V14-02-02-Lin.pdf).

All this adds up to one of the main issues in understanding the importance of MLOps, which is the difficulty of gauging technical debt, which is even harder to measure on the MLOps production pipeline. Lessons learned by Google engineers are written on the paper [The High-Interest Credit Card of Technical Debt](https://storage.googleapis.com/pub-tools-public-publication-data/pdf/43146.pdf), which highlights the main risks that occur on the ML systems in addition to the classic software-related debt.

It is essential to understand the change in mindset and the evolution, as [Andrej Karpathy states in the *software 2.0* article](https://karpathy.medium.com/software-2-0-a64152b37c35). This software evolves from the classical computer software written by the software engineer with a specific purpose to abstract and complex computer programs.

In the context of data science, complexity is growing with the exponential increase in the amount of information due to the improvement of *the automatic* and digital collection. There is no getting away from the fact that this is one of the reasons for the explosion of AI and data science, the tremendous amount of available generated information.

## The power of automation

MLOps advocates automating all the steps of the ML workflows, including all the stages present at the ML model lifecycle. The ultimate destination aims for a fully automated operation and easy monitoring. Depending on the level of automation in the ML processes, we assume different levels and actions. These are related to the speed of deployment of new models through experimentation with state-of-the-art algorithms. These different maturity levels are thoroughly explained in [MLOps: Continuous delivery and automation pipelines in machine learning](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning), another article from Google engineers. It is worth mentioning that Microsoft has a similar approach on the Maturity levels, but they have five different levels instead of three.

In short, it is interesting to remember that the common **steps** on the ML workflow are next:

1. Data collection
2. Data interpretation and preparation
3. Feature engineering
4. Feature selection
5. Model training
6. Model evaluation
7. Model deployment
8. Model serving, monitoring and maintenance

A fully automated pipeline has the ability to continuously deliver and deploy the model packaged, validated and running in the target infrastructure. Building a more complex testing pipeline is required, where validating the model against a different number of datasets is extremely important. To achieve that, among others, these new relevant components are (in the figure below):

- Data and model validation
- Feature store
- Metadata management
- ML pipeline trigger

![](https://miro.medium.com/max/1400/0*jPqlAYNP5DNpb0ue)

*Figure 3: ML pipeline automation from MLOps: Continuous delivery and automation pipelines in machine learning*

The benefits of these pipelines are, among others, enabling faster experiment and rapid iterations between them, accelerating time-to-value, continuous training of the model that is in production, sharing the environment in the development and production stage and so on.

A code commit triggers a CI/CD pipeline, which can enable the processes that promote the model to production quickly.

## Why is it so important?

The skills on the MLOps teams differ a bit from the standard software engineering team. Not only are the team skills significantly different, but also the development process. Accordingly, the data scientists that build ML models perform an **experimental** development process. For this reason, the hiring process typically focuses on data scientists. This different skill set has significant negative consequences, such as inexperience in building production systems. It is worth mentioning that data scientists spend most of the time constructing the architecture and preparing the data and not building/training models, as many people think. Consistent with the previous, one aspect is that the hiring focuses on the data scientists, whose tools and technologies are different from those used in deployment stages. In this scenario, the technical debt could become hidden, as apart from this skill set, other roles need representation to achieve success on the desired ML life cycle. However, this might change in the future as some of these roles are shifting to a more production-oriented job, which is many times the reason many companies ends up not deploying experimental models into production. For example, real-time machine learning, something vastly used for prediction systems, requires specific talent and infra.

Despite that, and following the advantages of the DevOps movement is the insight it provides as it forces the SW team to improve the business as a whole. Here, MLOps also tries to expand data-scientist teams' siloed knowledge to propagate it to every stage of the company, adapting to a data-driven for alignment with customer/business needs.

MLOps also helps increase ROI in the same manner as it helps mitigate the risk, as it is commonly a struggling process to ensure a suitable ROI, which, it is important to remember, is not the priority of the top players, at least in the short-term. The practices around the scaling machine learning around the company try to find a compromise between computing, team size, available data and expected revenue. For more details in this regard, watch the video [MLOps at Reasonable Scale](https://www.youtube.com/watch?v=Ndxpo4PeEms) talk at MLSys from Stanford.

We all know that AI is still a tech buzzword in wide use today since more than a decade ago. In this regard, we can show that current up-to-date and relevant stats regarding the adoption of AI, considering the impact of the COVID-19 pandemic year, the [McKinsey survey](https://www.mckinsey.com/business-functions/mckinsey-analytics/our-insights/global-survey-the-state-of-ai-in-2021) states that the business usage of AI has leveraged, as well as more advanced practices, enabling organisational shifts on all levels of a company. On the same page, AI adoption was 57%, up from 45% in 2020. On the MLOps side, the market is growing by leaps and bounds, as shown in a [report from Cognilytica](https://www.cognilytica.com/document/infographic-the-rapid-growth-of-mlops/), which predicts exponential growth in MLOps tools to reach USD 125 billion by 2025.

Definitely, C-level leaders will prioritise if they want to stay competitive, reduce risk and generate long-term value.

## I'm in production, and now what?

The statistics mentioned in the previous section showed that most companies do not deploy or have problems deploying ML models in production. The main problem is the lack of tools and appropriate processes to create and manage the production AI pipeline.

However, once this has taken place, which steps are required next? It is relevant to understand that ML projects are not static. Classic software is built on to satisfy certain specifications. Once it is deployed (to production), the software does not evolve. On the other hand, machine learning models are calibrated upon an objective evaluation on a given dataset (or multiple datasets), fulfilling X requirements or specifications. Thus, the performance changes when the data changes.

For this reason, the feedback loop is relevant, as it is a countermeasure to adapt to the deterioration of the model quality. Model monitoring puts the mentioned loop back to the model stage, creating another input for the development stage, making and driving constant improvements across the time. Feedback loops, which are familiar with Agile frameworks, are simple to understand. The basics of these loops are the basis of good communication to build good software, getting feedback that can be fed into the development process immediately. Doing this each iteration improves the development process.

Another aspect to consider, even though the models are available in production, which would allow us to write a complete article, is the **Model Governance or Governance of ML processes**. This represents another *building block* of MLOps, which implies iteratively checking on all the stages to comply with CCPA/GDPR. The business should constantly try to find potential new bias, fairness and explainability checks before deploying ML models to production. The white paper from the European Commission's "[*On Artificial Intelligence - A European approach to excellence and trust*](https://ec.europa.eu/info/sites/default/files/commission-white-paper-artificial-intelligence-feb2020_en.pdf)" points out the potential risks and benefits of using AI.

Last but not least, and related to post-production must-do things, it is essential to use a service for monitoring to feed the feedback loop mentioned above. This is done by using visualization tools like Kibana, where model performance can be tracked, preventing or foreseeing undesired behaviours changes on real-world data.

## Current status of the solutions

Whereas 2012–2015 were the years of the Image and Vision explosion and 2019–2020 NLP outbreaks, 2021–2022 are being the years of MLOps. Seen from the production-side angle, since 2018, the *dockerized* machine learning stack is mainstream. One of the main changes that are taking place is that, in addition to the closed-source solutions present in the industry that offer compelling services for the small-medium scale companies, open-source solutions are being developed and acquiring suitable maturity. Thanks to major companies like Netflix or Airbnb open-sourcing their MLOps solutions with [Metaflow](https://metaflow.org/) and [Apache Airflow](https://airflow.apache.org/).

For a more exhaustive curated list of open source libraries, check the [Awesome production machine learning: State of MLOps Tools and Frameworks](https://github.com/EthicalML/awesome-production-machine-learning) repo and more comprehensive analysis of end-to-end solutions [here](https://www.ambiata.com/blog/2020-12-07-mlops-tools/).

![](https://miro.medium.com/max/1400/0*pOnuGAABV3vZmMMe)

*Figure 4: LF AI & Data Foundation Interactive Landscape*

The figure above has an **interactive landscape view** from the Linux Foundation [here](https://landscape.lfai.foundation/). An alternative landscape view is from MLReef [here](https://about.mlreef.com/images/blog/ml_landscape.png). Also, Chip Huyen has a sublime exhaustive study of the landscape and available tools [here](https://huyenchip.com/2020/06/22/mlops.html). It is important to remember that most MLOps platforms do not provide a silver bullet for the complete life cycle. Therefore, the choice of the tools must be carefully considered, considering the strengths and weaknesses of the engineering teams and infrastructure.

![](https://miro.medium.com/max/1400/0*xpphnJXooVu65K5I)

*Figure 5: The most known open-source solutions*

2021 and 2022 are starting to consolidate some solutions, as shown in the figure. In the above figure, we can see the evolution on GitHub the trend of the most relevant open-source solutions. As can be seen, there are different *types* of tools depending on the needs:

- Data Pipeline ETL (Extract Transform Load) frameworks: The most mature solutions are well-known, like [Apache Airflow](https://airflow.apache.org/) and [Luigi](https://github.com/spotify/luigi), where real-life data science is the aim. Two frameworks comprehend all the workflow management, including scheduler, batch jobs and even a UI.
- Model Training: Typical AI/DL frameworks are dominant here. The most widely used are well established in the industry, i.e. [Tensorflow](https://github.com/tensorflow/tensorflow), [Pytorch](https://github.com/pytorch/pytorch), and [Apache MXNet](https://github.com/apache/incubator-mxnet). For more complex requirements, there are alternatives like [Horovod](https://github.com/horovod/horovod), which adds the distributed training seamlessly.
- Model Serving: Separating the model serving from the client application is standard procedure for working with ML models in production. [Tensorflow Serving](https://github.com/tensorflow/serving) is the preferred approach for Tensorflow-only deployments, while [BentoML](https://github.com/bentoml/BentoML) represents an easy-to-use multi-framework approach. [Triton Inference Server](https://github.com/triton-inference-server/server), on the other hand, is an alternative designed for CPU and GPU-based infrastructures, cloud, data centre or even the edge.
- Model interoperability: [ONNX](https://github.com/onnx/onnx) and [MMdnn](https://github.com/Microsoft/MMdnn), as cross-framework solutions that provide conversion tools between different formats. The first is also an Open Neural Network Exchange Format.
- Model and Data Versioning: When it comes to ML experimentation, it is critical to have tools for version types of artifacts, including but not limited to models, datasets and experiments. The main tools here are [DVC](https://github.com/iterative/dvc), [MLFlow](https://github.com/mlflow/mlflow) and [lakeFS](https://github.com/treeverse/lakeFS).
- Experiment Tracking: [MLFlow](https://mlflow.org/docs/latest/tracking.html) has the required components for logging, code versions, metrics, etc.

## Closing thoughts

Regardless of the current status, making the necessary changes to introduce MLOps might seem tricky as the business impact is usually hard to gauge. The DevOps mantra that says, "you build it, you run it", is well-known. MLOps, which requires even more interdisciplinary collaboration between members of multiple teams, would say: "you design it, you train it, you run it". Thus, the main ingredients to get the most value from AI are data, technology and people. In reality, all the different job positions, namely data engineers, data analysts, data scientists, IT (people), testers, and operations people, collaborate on a daily basis. In theory, they should provide the highest quality, simplified management and automatic deployment of ML models.

Depending on the type of the company, one important decision to tackle, once you discard an end-to-end solution, is which of the open-source solutions from the vast landscape do you use as bricks to build your pipeline. This will be the rule while building an industry canonical ML stack.

Startups need to unlock the potential of AI to build a strong culture around this discipline. It is not by chance that the Algorithmia 2021 enterprise ML Trends report shows that Organizational alignment is the most relevant gap in achieving AI/ML maturity. In the end, to keep up with the speed of innovation of the competitors with those practices and culture, it will become a requirement for companies that apply ML in production. In other words, fostering the culture of collaboration will imply a better understanding of the problems to address, which will end up in a better choice of adequate MLOps tool, as long as that is what you need. There is no doubt that MLOps, when done right, can accelerate the time-to-market speed significantly.

Lastly, in the following MLOps-related posts, I will create an end-to-end solution using one of the most relevant open-source solutions, i.e. Kubeflow / MLflow.

## References

**Research Papers**

- [Hidden Technical Debt in Machine Learning Systems](https://papers.nips.cc/paper/2015/file/86df7dcfd896fcaf2674f757a2463eba-Paper.pdf)
- [MLOps: Continuous delivery and automation pipelines in machine learning](https://cloud.google.com/solutions/machine-learning/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning)
- [Machine Learning: The High Interest Credit Card of Technical Debt](https://research.google/pubs/pub43146/)
- [Scaling Big Data Mining Infrastructure: The Twitter Experience](https://www.kdd.org/exploration_files/V14-02-02-Lin.pdf)

**Articles**

- [Continuous Delivery for Machine Learning](https://martinfowler.com/articles/cd4ml.html#IntroductionAndDefinition)
- [ML Ops: Machine Learning as an Engineering Discipline](https://towardsdatascience.com/ml-ops-machine-learning-as-an-engineering-discipline-b86ca4874a3f)
- [MLOps Maturity Model - Azure ML](https://microsoft.github.io/azureml-ops-accelerator/1-MLOps%20Foundations/1-MLOpsOverview/2-MLOpsMaturityModel.html)
- [ML and MLOps at a Reasonable Scale](https://towardsdatascience.com/ml-and-mlops-at-a-reasonable-scale-31d2c0782d9c)
- [MLOps Principles](https://ml-ops.org/content/mlops-principles)
- [The state of AI in 2021](https://www.mckinsey.com/business-functions/mckinsey-analytics/our-insights/global-survey-the-state-of-ai-in-2021)
- [Software 2.0 | Andrej Karpathy](https://karpathy.medium.com/software-2-0-a64152b37c35)
- [The ML Test Score: A Rubric for ML Production Readiness and Technical Debt Reduction](https://static.googleusercontent.com/media/research.google.com/es//pubs/archive/aad9f93b86b7addfea4c419b9100c6cdd26cacea.pdf)
- [What I learned from looking at 200 machine learning tools](https://huyenchip.com/2020/06/22/mlops.html) and the updated [Machine Learning Tools Landscape v2 (+84 new tools)](https://huyenchip.com/2020/12/30/mlops-v2.html)
- [What Is MLOps? | NVIDIA](https://blogs.nvidia.com/blog/2020/09/03/what-is-mlops/)
- [Why we deploy machine learning models with Go - not Python](https://medium.com/@calebkaiser/why-we-deploy-machine-learning-models-with-go-not-python-a4e35ec16deb)

**Books**

- [Introducing MLOps: How to Scale Machine Learning](https://www.amazon.com/Introducing-MLOps-Machine-Learning-Enterprise/dp/1492083291)
- [Machine Learning Engineering book by Andriy Burkov](http://www.mlebook.com/wiki/doku.php?id=start)

**Awesome lists**

- [Awesome MLOps](https://github.com/visenger/awesome-mlops)
- [Awesome production machine learning](https://github.com/EthicalML/awesome-production-machine-learning)
