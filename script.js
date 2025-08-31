const form = document.getElementById('contactForm');

form.addEventListener('submit', function(e) {
  e.preventDefault();
  alert('¡Mensaje enviado! Gracias por contactarme.');
  form.reset();
});
// Animación fade-in
const sections = document.querySelectorAll('section');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.2 });

sections.forEach(section => {
  section.classList.add('fade-in');
  observer.observe(section);
});
// Menú hamburguesa
const menuToggle = document.getElementById('menu-toggle');
const navbar = document.getElementById('navbar');

menuToggle.addEventListener('click', () => {
  navbar.classList.toggle('show');
});
// Slider proyectos
let index = 0;
const slider = document.querySelector('.proyectos-slider');
const proyectos = document.querySelectorAll('.proyecto');

document.getElementById('next').addEventListener('click', () => {
  if(index < proyectos.length - 1) index++;
  slider.style.transform = `translateX(-${index * 320}px)`;
});

document.getElementById('prev').addEventListener('click', () => {
  if(index > 0) index--;
  slider.style.transform = `translateX(-${index * 320}px)`;
});
// Dark mode toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});
let sliderIndex = 0;
const sliderContainer = document.querySelector('.proyectos-slider');
const proyectosItems = document.querySelectorAll('.proyecto');

document.getElementById('next').addEventListener('click', () => {
  if(sliderIndex < proyectosItems.length - 1) sliderIndex++;
  sliderContainer.scrollTo({
    left: sliderIndex * 320,
    behavior: 'smooth'
  });
});

document.getElementById('prev').addEventListener('click', () => {
  if(sliderIndex > 0) sliderIndex--;
  sliderContainer.scrollTo({
    left: sliderIndex * 320,
    behavior: 'smooth'
  });
});
