let container = document.querySelector(".container");
let slider = document.querySelector(".slider");
let slides = document.querySelectorAll(".slide").length;
const buttons = document.getElementsByClassName("btn");


let currentPosition = 0;
let currentMargin = 0;
let slidesPerPage = 0;
let slidesCount = slides - slidesPerPage;
let containerWidth = container.offsetwidth;
let prevKeyActive = false;
let nextKeyActive = true;

window.addEventListener("resize", checkWidth);

function checkWidth() {
    containerWidth = container.offsetwidth;
    setParams(containerWidth);
}

function setParams(w) {
    if (w < 551) {
        slidesPerPage = 1;
    } else {
        if (w < 901) {
            slidesPerPage = 2;
        } else {
            if (w < 1101) {
                slidesPerPage = 3;
            } else {
                slidesPerPage = 4;
            }
        }
    }
    slidesCount = slides - slidesPerPage;
    if (currentPosition > slidesCount) {
        currentPosition -= slidesPerPage;
    };
    currentMargin = - currentPosition * (100 / slidesPerPage);
    slider.style.marginLeft = currentMargin + '%'
    if (currentPosition > 0) {
        buttons[0].classList.remove('inactive');
    }
    if (currentPosition < slidesCount) {
        buttons[1].classList.remove('inactive');
    }
    if (currentPosition >= slidesCount) {
        buttons[1].classList.add('inactive');
    }
}

setParams();

function slideRight(){
    if(currentPosition != 0) {
        slider.style.marginLeft = currentMargin + (100 / slidesPerPage) + '%';
        currentMargin += (100 / slidesPerPage);
        currentPosition--;
    };
    if (currentPosition === 0 ){
        buttons[0].classList.add('inactive');
    }
    if (currentPosition < slidesCount) {
        buttons[1].classList.remove('inactive');
    }
};

function slideLeft(){
    if(currentPosition != slidesCount) {
        slider.style.marginLeft = currentMargin - (100 / slidesPerPage) + '%';
        currentMargin -= (100 / slidesPerPage);
        currentPosition++;
    };
    if (currentPosition == slidesCount) {
        buttons[1].classList.add('inactive');
    }
    if(currentPosition > 0) {
        buttons[0].classList.remove('inactive');
    }
}

const tamanhoCheckboxes = document.querySelectorAll('.filter.tamanho');
const corCheckboxes = document.querySelectorAll('.filter.cor');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const items = document.querySelectorAll('.item');

priceRange.addEventListener('input', filterItemsByPrice);

function filterItemsByPrice() {
    const maxPrice = parseInt(priceRange.value);
    priceValue.textContent = maxPrice;

    items.forEach(item => {
        const itemPrice = parseFloat(item.querySelector('.item-price').textContent.replace('R$', '').replace(',', ''));
        if (itemPrice <= maxPrice) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterItemsBySizeAndColor() {
    const selectedTamanhos = Array.from(tamanhoCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const selectedCores = Array.from(corCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

    items.forEach(item => {
        const matchesTamanho = selectedTamanhos.length === 0 || selectedTamanhos.some(tamanho => item.classList.contains(tamanho));
        const matchesCor = selectedCores.length === 0 || selectedCores.some(cor => item.classList.contains(cor));

        if (matchesTamanho && matchesCor) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function filterItems() {
    filterItemsByPrice();
    filterItemsBySizeAndColor();
}

document.querySelectorAll('.filter').forEach(checkbox => checkbox.addEventListener('change', filterItems));
priceRange.addEventListener('input', filterItems);
tamanhoCheckboxes.forEach(checkbox => checkbox.addEventListener('change', filterItemsBySizeAndColor));
corCheckboxes.forEach(checkbox => checkbox.addEventListener('change', filterItemsBySizeAndColor));

// Inicializa mostrando todos os itens
items.forEach(item => item.style.display = 'block');