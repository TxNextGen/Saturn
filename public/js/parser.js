let _path
let _objlist = []
let _lastvalidsearch = ""

function loadFile(path) {
    _path = path

    let s = document.createElement('script');
    s.src = path;

    s.onload = () => { // Wait for the script to fully load
        readJS();
    };

    s.onerror = (err) => {
        console.error("Error loading script", err);
    };

    document.body.appendChild(s);
}

function readJS() {
    if (json) {
        window.addEventListener('keydown',(e)=>{if (e.key === "D"){ devInfo(json); }});
        createElements();
    } else {
        console.error("JSON data is not available");
    }
}

function openPage(type,src,title){
    window.top.location = `/i.html?type=${type}&src=${src}&title=${title}`
}

function noImgs(json) {
    let titles = [];
    json.forEach(obj => {
        if (!obj.hasOwnProperty('img')) {
            titles.push(obj.title);
        }
    });
    return {"titles":titles,"number":titles.length};
}

function purifyText(input) { //ty gpt for doing regex and shi
    return input
        .toLowerCase()                     // Convert to lowercase
        .replace(/[^a-z0-9]/g, '')         // Remove all non-alphanumeric characters
        .trim();                           // Trim any leading/trailing whitespace
}

function devInfo(json){
    let w = window.open('');
    w.document.write(`
    <style>*{font-family: monospace;}</style>
    <b>This is literally only here for random dev info I need, if you got here by accident just close the tab and move on. -Jobi</b>
    <br>
    <p>If your another dev genuinely using this page and have a recommendation for something to be added, dm me on discord :) 'Jobi#8313' or '_jobi_'</p>
    <h1>Dev Info:</h1>
    <p>Dev info for /js/parser.js</p>
    <br>
    <h2>File Info:</h2>
    <p>Path of loaded file: ${_path}</p>
    <p>Entries: ${json.length}</p>
    <br>
    <h2>Img info:</h2>
    <h3>Entries without images <span style="color: red; font-weight: bolder;">[ADD THESE DUMBASS]</span>:</h3>
    <p>I'm too lazy to add detection for an image that failed to load, just do 'ctrl+r' on this page and then check console / network in devtools</p>
    <p>Number of entries without imgs: ${noImgs(json).number}</p>
    <textarea style="width:250px; height: 250px;">${noImgs(json).titles.map(title => title + "\n").join('')}</textarea>
    <h
    `);
}

function createElements() {
    document.getElementById('preload').remove();

    document.getElementById('objs').innerHTML += `
    <style>
    .searchBar {
        background: linear-gradient(-135deg, var(--primary-mid), var(--primary-dark));
        box-shadow: 0px 0px 15px var(--primary-mid);
        height: 50px;
        width: 50%;
        padding-left: 10px;
        border-radius: 30px;
        max-width: 500px;
        margin: 15px;
    }
    </style>
    <div style="width:100%;display:flex;justify-content:center;align-items:center;flex-direction:column;">
        <style>input::placeholder{ color: white; }</style>
        <input id="searchBar" class="searchBar" placeholder="Type to Search" style="color: white;">
        <h3 style="margin:7.5px;" id="validsearch" hidden='true'>
            There were no results for '<span id="currentsearch"></span>', showing results for '<span id="lastvalidsearch"></span>' instead.
        </h3>
    </div>
    `

    const searchBar = document.getElementById('searchBar');

    searchBar.addEventListener('keyup',(e)=>{
        let key = e.key;
        let searchText = purifyText(searchBar.value)

        //console.clear();

        let results = {
            failed: [

            ],
            success: [

            ]
        }

        _objlist.forEach((entry)=>{
            entry = String(entry).split(',');

            let entryTitle = purifyText(entry[0])
            let entryId = entry[1]
            let entryTags = entry[2]
            let entryDesc = entry[3]

            if ((entryTitle.includes(searchText))){ //if you want to include descriptions in the search -> (entryDesc.includes(searchText))
                results.success.push(entryId)
            } else{
                results.failed.push(entryId)
            }

            if (results.success.length === 0){
                
                document.getElementById('validsearch').hidden = false;

                document.getElementById('currentsearch').textContent = searchText

                document.getElementById('lastvalidsearch').textContent = _lastvalidsearch

            } else{

                document.getElementById('validsearch').hidden = true;

                _lastvalidsearch = searchText

                results.failed.forEach((e)=>{
                    document.getElementById(e).style.display = 'none'
                })
                
                results.success.forEach((e)=>{
                    document.getElementById(e).style.display = 'block'
                })

            }
        })
    })

    let id = 0

    json.forEach((obj) => {

        let title = String(obj.title).replace(`'`,``);
        let tags = obj.tags;
        let loadType = obj.type;
        let img = obj.img;
        let description = obj.description || "No description"
        let listed = obj.listed;
        let source = String(obj.source).replace(`'`,``);

        if (listed) {
            // Create object holder div
            let objHolder = document.createElement('div');
            objHolder.setAttribute('id',id);
            objHolder.setAttribute('class', 'objHolder');
            objHolder.setAttribute('onclick',`openPage('${loadType}','${source}','${title}')`)

            // Image
            let imgElem = document.createElement('img');
            imgElem.setAttribute('class','objImg')

            if (img != undefined){
                imgElem.src = '/files/thumbs/' + img;
            } else{
                imgElem.src = 'https://placehold.co/200x200';
            }

            imgElem.width = 150;
            imgElem.height = 150;

            objHolder.appendChild(imgElem)

            let holderDiv = document.createElement('div')
            holderDiv.style = 'margin-bottom: 5px; position:absolute; width:100%; display: flex; align-items: center; justify-content: center; z-index: 69420; text-align: center;'

            let titleElem = document.createElement('h3');
            titleElem.textContent = title;
            titleElem.style = 'background-color: var(--accent-color); border-radius: 25px; padding: 5px;'

            holderDiv.appendChild(titleElem);

            objHolder.appendChild(holderDiv)
            document.getElementById('objs').appendChild(objHolder)

            _objlist.push(`${title},${id},${tags},${description}`)
        
            id++;
        }
    });
}