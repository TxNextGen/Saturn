let messages = [
    "Just a moment while we set everything up..."
];

const loaderText = document.getElementById('loader-text');
loaderText.innerHTML = messages[0];

if (localStorage.getItem('load-enabled') == 'true'){
    window.addEventListener('load',()=>{
        const loader = document.getElementById('loader');
        window.setTimeout(()=>{
            loader.style.transition = "0.2s"
            loader.style.opacity = 0
            if(loader){window.setTimeout(()=>{loader.remove()},200)}
        })
    })
} else{
    document.getElementById('loader').remove();
}
