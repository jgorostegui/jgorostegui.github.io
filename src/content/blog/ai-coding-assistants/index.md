---
title: "Streamlining Programming Workflows: How AI coding assistants change the game"
date: 2023-05-05
description: "How tools like GitHub Copilot and ChatGPT are transforming the coding process and boosting developer productivity."
image: "./github_copilot_logo.webp"
tags: ["AI", "Artificial Intelligence", "Large Language Models", "Github Copilot", "Programming", "Productivity"]
authors: ["josu-gorostegui"]
---

Lately, there have been concerns regarding the use of coding assistants such as [GitHub Copilot](https://github.com/features/copilot). It's interesting to examine how tools like ChatGPT, GitHub Copilot, and similar LLMs-based solutions can help developers and software engineers boost their productivity. Setting privacy concerns aside, it is fascinating to consider how these tools transform the coding process. How much **time** do we truly spend on coding and how much on understanding the problem? Does the improvement justify adding this to every developer's tool belt? I would argue that **coding is not limited to any specific programming language or the act of writing code itself.** Instead, it involves developing a computational thinking mindset that improves problem-solving skills, logical solutions, and critical thinking. AI-powered neural networks amplify these attributes, making them valuable additions to the programming process.

[@KentBeck](https://twitter.com/KentBeck), the author of Extreme Programming (XP), recently shared his thoughts on this topic on [Twitter](https://twitter.com/KentBeck/status/1648413998025707520).

This topic is further elaborated in a [subsequent article](https://tidyfirst.substack.com/p/90-of-my-skills-are-now-worth-0?sd=pf) about how some skills have been commoditized over time. In this regard, there is no discussion that technological revolutions proceed by reducing the cost of something that was once expensive and discovering the value of what has become cheap.

### Benefits and drawbacks of AI coding assistants

Researching some studies, I have found that one of the most recent ones, GitHub Next Team [*quantified Copilot's impact on developer productivity and happiness*](https://github.blog/2022-09-07-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/), by reducing the time spent on coding tasks, improving code quality, and providing a more enjoyable learning experience, Copilot is proving to be a **valuable addition** to the software development process. Here the numbers show a substantial improvement, which has been covered using the [SPACE framework](https://queue.acm.org/detail.cfm?id=3454124) for measuring productivity. This framework provides a comprehensive understanding of developer productivity by considering **s**atisfaction and well-being, **p**erformance, **a**ctivity, **c**ommunication and collaboration, and **e**fficiency and flow. This approach highlights the importance of considering multiple dimensions of productivity to gain a more holistic view and mitigate the limitations of focusing solely on individual metrics or activities. The findings indicate that the completion time of tasks is reduced whereas irrelevant and repetitive tasks are eliminated. Here the chatbot aspect is different from a typical search under Stack Overflow, as a good conversation is about balance, controlling for the right level of repetition, specificity, and question-asking.

To assess the mentioned perception, a controlled experiment was carried out. In this study, the group utilizing GitHub Copilot achieved a higher task completion rate (78%) than the group without Copilot (70%). Importantly, developers employing Copilot finished tasks 55% more quickly, averaging 1 hour and 11 minutes, whereas those not using Copilot required 2 hours and 41 minutes. These findings were statistically significant, with a 95% confidence interval for the percentage speed increase ranging from 21% to 89%.

Further reading in the related article [1c](https://arxiv.org/pdf/2205.06537.pdf), the publication discusses how neural code synthesis has reached a point where snippet generation is accurate enough to be considered for integration into human software development workflows. If ChatGPT is particularly helpful to people who have strong idea-generation skills but struggle with writing and communication, it could have significant implications for the labor market by expanding occupational choices and increasing earnings.

Not all are positive things for using neural code completion tools, which can be inferred from the tweet mentioned initially, and this will make us, over time, worse programmers. This can be problematic for new programmers, who may rely too much on the assistance and not notice bad optimization or vulnerability issues. Generally, this over-reliance on AI suggestions could have a potential impact on creativity, or the potential of reinforcing biased algorithms. Despite these concerns, studies like [3](https://arxiv.org/pdf/2204.04741.pdf) have shown that Copilot is not worse than human developers in generating vulnerable code, indicating that humans are more likely to create newer vulnerabilities. While further research is needed in this area, the rapid growth of these tools suggests that concerns may diminish over time, as is the case with most technological revolutions. In related studies, in [4](https://arxiv.org/pdf/2302.00438.pdf), the importance of providing accurate descriptions is highlighted. Describing the components appears to be particularly important.

One of the issues that I see in the publications is that the comparison is somehow biased. From a developer's perspective, comparing the user experience of neural network-based tools requires considering different setups. For instance, it's not the same to compare using Visual Studio without plugins (or other IDE code editors like emacs) to using Visual Studio enhanced with IntelliCode and additional plugins. Moreover, in these studies correlation between coding and productivity is analyzed, which might not mean causation. While used metrics on the reports can help estimate productivity, they don't directly influence it. Furthermore, a programmer's perceived productivity might not accurately represent their true productivity level or performance [1c](https://arxiv.org/pdf/2205.06537.pdf).

### The Future

Looking ahead, it is likely that these tools will become more accurate and efficient in the years to come, which are having and will have a **significant impact** on the developer community. However, there is still work to be done in terms of improving usability and workflows, as new ways of solving problems will inevitably emerge with these new tools. **Code explanation, validation, and task decomposition** are just a few examples of features that would be of great interest to those using AI-assisted generation tools. Thus, more experienced developers may need to adjust or recalibrate their workflow, while junior members may have an advantage by starting their training with ChatGPT/Copilot.

### Conclusion

Ultimately, it's clear that coding is more than just typing, and ChatGPT and GitHub Copilot's primary value is not in enabling users to write the most lines of code possible. Instead, their purpose is to **help users** achieve their goals as efficiently as possible, as all previously existing tooling. Occasionally, a suggestion that acts as a useful template for experimentation may be just as effective, if not more so, than a perfectly correct yet unremarkable line of code that only saves a few keystrokes. As a result, focusing solely on suggestion accuracy would not provide a comprehensive understanding of these tools.

Instead of viewing code suggestions as a way to maximize code output, it might be more accurate to consider them as a form of conversation with a chatbot. In this context, the proper use of these tools and *accurate prompting* might have more weight than today's established skills, as evidenced by the emergence of [prompt engineering courses such as the one from OpenAI](https://www.deeplearning.ai/short-courses/chatgpt-prompt-engineering-for-developers/), in this case, oriented to ChatGPT. Embracing AI coding assistance is part of the software development landscape evolution, which probably will end up balancing human expertise and AI assistance and leveraging the solutions created in the future.

### References

1. GitHub Next team:
    - Blog: [Research: quantifying GitHub Copilot's impact on developer productivity and happiness](https://github.blog/2022-09-07-research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/)
    - Blog: [Research: How GitHub Copilot helps improve developer productivity](https://github.blog/2022-07-14-research-how-github-copilot-helps-improve-developer-productivity/)
    - Article: [Productivity Assessment of Neural Code Completion](https://arxiv.org/pdf/2205.06537.pdf)
2. [ML-Enhanced Code Completion Improves Developer Productivity](https://ai.googleblog.com/2022/07/ml-enhanced-code-completion-improves.html)
3. [Is GitHub's Copilot as bad as humans at introducing vulnerabilities in code?](https://arxiv.org/pdf/2204.04741.pdf)
4. [On the Robustness of Code Generation Techniques: An Empirical Study on GitHub Copilot](https://arxiv.org/pdf/2302.00438.pdf)
5. [Practices and Challenges of Using GitHub Copilot: An Empirical Study](https://arxiv.org/pdf/2303.08733.pdf)
6. [90% of My Skills Are Now Worth $0](https://tidyfirst.substack.com/p/90-of-my-skills-are-now-worth-0?sd=pf)
7. [The SPACE of Developer Productivity](https://queue.acm.org/detail.cfm?id=3454124)
