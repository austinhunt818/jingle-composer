import { SplendidGrandPiano } from "https://unpkg.com/smplr/dist/index.mjs";

window.onload = loaded;
const context = new (window.AudioContext || window.webkitAudioContext)();
const piano = new SplendidGrandPiano(context);

const NOTE_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];

var songId = window.location.search.substring(window.location.search.indexOf('id')+3);

var songEncoding = '';
var tempoFactor = 3;
document.getElementById('tempoSlider').value = tempoFactor;

function loaded() {
    if(songId != ''){
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function () {
            var xhrResponse = JSON.parse(xhr.response);
            songEncoding = xhrResponse.songEncoding;
            tempoFactor = xhrResponse.tempo;
            document.getElementById('tempoSlider').value = tempoFactor;
            document.getElementById('titleInput').value = xhrResponse.name;
            populateInteractiveGrid();
        });
        xhr.open("GET", `https://va4kva7kjc.execute-api.us-east-2.amazonaws.com/items/${songId}`);
        xhr.send();
    }
    else populateInteractiveGrid();
}

var selectedNotes = ['-', '-', '-', '-', '-', '-', '-', '-', '-' ,'-', '-', '-', '-' ,'-', '-', '-'];

function decodeSong(){
    if(songEncoding.charAt(0) == 'S'){
        var encodeIndex = 1;
        selectedNotes.forEach((note, i)=>{
            if(songEncoding.charAt(encodeIndex) == '-') encodeIndex++;
            else{
                selectedNotes[i] = songEncoding.substring(encodeIndex,encodeIndex+2);
                encodeIndex+=2;
            }
        })
    }
}


//setup note buttons dynamically
function populateInteractiveGrid() {
    decodeSong();
    for(var i = 1; i <= 16; i++){
        document.querySelector('.interactiveContainer').innerHTML += `
        <div class="noteColumn" id="note-${i}">
            <button class="noteButton" id="G5-${i}">G5</button>
            <button class="noteButton" id="F5-${i}">F5</button>
            <button class="noteButton" id="E5-${i}">E5</button>
            <button class="noteButton" id="D5-${i}">D5</button>
            <button class="noteButton" id="C5-${i}">C5</button>
            <button class="noteButton" id="B4-${i}">B4</button>
            <button class="noteButton" id="A4-${i}">A4</button>
            <button class="noteButton" id="G4-${i}">G4</button>
            <button class="noteButton" id="F4-${i}">F4</button>
            <button class="noteButton" id="E4-${i}">E4</button>
            <button class="noteButton" id="D4-${i}">D4</button>
            <button class="noteButton" id="C4-${i}">C4</button>
            <p class="noteLabel"> </p>
        </div>
        `;
    }
    selectedNotes.forEach((note, i) =>{
        if(note != '-'){
            var button = document.getElementById(note+ '-' + (i+1));
            button.style.backgroundColor = 'green';
        } 
    });
}

//note selection functionality
document.querySelector('.interactiveContainer').addEventListener('click', function (e){
    var selectedButton = '';
    var selectedCol = '';
    if(e.target.tagName === 'BUTTON'){
        piano.start({ note: e.target.id.substring(0,2), duration: .5});
        selectedButton = e.target.id.substring(0,2);
        selectedCol = e.target.id.substring(3);
        e.target.style.backgroundColor = 'green';
        for(var i = 0; i < 12; i++){
            var button = document.querySelector(`#${NOTE_NAMES[i]}-${selectedCol}`);
            if(!(button === e.target)){
                button.style.backgroundColor = 'lightgrey';
            }
        }
        selectedNotes[selectedCol-1] = selectedButton;
    }
});

//Tempo slider functionality
document.getElementById('tempoSlider').addEventListener('input', ()=>{tempoFactor=document.getElementById('tempoSlider').value;});

document.getElementById("playButton").addEventListener('click', playSong);

//Play song functionality
function playSong(){
    const now = context.currentTime;
    selectedNotes.forEach((note, i) => {
        piano.start({ note, time: now + i/tempoFactor, duration: 0.5 });
    });
}


//Save button functionality
document.getElementById('saveButton').addEventListener('click', addSong);


function addSong(){
    console.log("add");
    var name = document.getElementById('titleInput').value;
    var encodedSong = "S";

    selectedNotes.forEach((note) => {
        encodedSong += note;
    });
    encodedSong  += "X";

    console.log(songId);
    let xhr = new XMLHttpRequest();
    xhr.open("PUT", "https://va4kva7kjc.execute-api.us-east-2.amazonaws.com/items");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({
        "id": songId,
        "songEncoding": encodedSong,
        "name": name,
        "tempo": tempoFactor + "",
    }));

    
    console.log(name);
}


