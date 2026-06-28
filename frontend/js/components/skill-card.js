export function createSkillCard(skill) {
  return `
    <article class="skill-card">
      <h3>${skill.title}</h3>
      <p>${skill.description}</p>
      <span class="skill-meta">Nivel: ${skill.level}</span>
    </article>
  `;
}
