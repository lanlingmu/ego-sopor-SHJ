export function createFilters(section, { motion }) {
  if (!section) return;
  const controller = new AbortController();
  const buttons = [...section.querySelectorAll('[data-filter]')];
  const cards = [...section.querySelectorAll('.project')];
  const status = section.querySelector('.results');
  cards.forEach((card, index) => { card.dataset.slot = String(index); });
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected));
    });
    let count = 0;
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.type !== button.dataset.filter;
      if (!card.hidden) {
        card.dataset.slot = String(count++);
        card.classList.add('is-visible');
        if (!motion.matches) card.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, delay: (count - 1) * 35, fill: 'backwards', easing: 'ease-out' });
      }
    });
    if (status) status.textContent = `显示 ${count} 个网站`;
  }, { signal: controller.signal }));
  return { destroy() { controller.abort(); } };
}
