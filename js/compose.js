/**
 * This file handles the interactive music staff functionality and the database communication. It uses
 * the smplr package to play notes, and to play them as a jingle.
 * @author Austin Hunt
 */


import { SplendidGrandPiano, Soundfont } from "https://unpkg.com/smplr/dist/index.mjs";

window.onload = loaded;
const context = new (window.AudioContext || window.webkitAudioContext)();

// Initialize the instruments
const piano = new SplendidGrandPiano(context);
const marimba = new Soundfont(context, { instrument : 'marimba'});
const trumpet = new Soundfont(context, { instrument : 'trumpet'});
const flute = new Soundfont(context, { instrument: 'flute' });
const guitar = new Soundfont(context, { instrument: 'acoustic_guitar_nylon' });
const saxophone = new Soundfont(context, { instrument: 'alto_sax' });

// Define the instruments in an object for easy access
const instruments = {'piano' : piano, 'marimba' : marimba, 'trumpet' : trumpet, 
                     'flute' : flute, 'guitar' : guitar, 'saxophone' : saxophone};
var selectedInstrument = 'piano';

const NOTE_NAMES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5'];

var songId = window.location.search.substring(window.location.search.indexOf('id')+3);

var songEncoding = '';
var tempoFactor = 3;


/**
 * Loads initial event listeners, song data, and populates the interactive grid accordingly
 */
function loaded() {
    if (typeof window !== 'undefined' && window.QUnit) {
        return;
      }

    //Sound select functionality
    document.querySelector('#instrumentSelect').addEventListener('change', (e)=>{
        selectedInstrument = e.target.value;
        console.log(`Instrument changed to ${e.target.value}`);
    });

    const TEST_NOTE_NAMES = ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5'];
    //Test slider functionality
    for(let i = 0; i < 16; i++){
        document.getElementById(`noteSlider-${i+1}`).addEventListener('input', (e)=>{
            var noteIndex = parseInt(e.target.value);
            if(noteIndex < 0 || noteIndex >= TEST_NOTE_NAMES.length){
                document.getElementById(`testNote-${i+1}`).innerText = '_';
                selectedNotes[i] = '-';
                e.target.classList.remove("has-note");
            }
            else{
                document.getElementById(`testNote-${i+1}`).innerText = TEST_NOTE_NAMES[noteIndex];
                selectedNotes[i] = TEST_NOTE_NAMES[noteIndex];
                instruments[selectedInstrument].start({ note: TEST_NOTE_NAMES[noteIndex], duration: .5 });
                e.target.classList.add("has-note");
            }
        });
    }

    //Tempo slider functionality
    document.getElementById('tempoSlider').addEventListener('input', ()=>{tempoFactor=document.getElementById('tempoSlider').value;});

    document.getElementById('tempoSlider').value = tempoFactor;
    // document.getElementById('saveButton').addEventListener('click', addSong);
    document.getElementById("playButton").addEventListener('click', playSong);


    if(songId != ''){
        document.querySelector('.controlRow').innerHTML+= `<div class="composeButton">
          <button name="deleteButton"><img class="deleteButton" id="deleteButton" src="img/delete.png" alt="delete button"/></button>
          <label for="deleteButton">Delete Song</label>
        </div>`;

        // document.getElementById('saveButton').addEventListener('click', addSong);
        document.getElementById("playButton").addEventListener('click', playSong);
        document.getElementById("deleteButton").addEventListener('click', deleteSong);


        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", function () {
            var xhrResponse = JSON.parse(xhr.response);
            songEncoding = xhrResponse.songEncoding;
            tempoFactor = xhrResponse.tempo;
            document.getElementById('tempoSlider').value = tempoFactor;
            document.getElementById('titleInput').value = xhrResponse.name;
        });
        xhr.open("GET", `https://va4kva7kjc.execute-api.us-east-2.amazonaws.com/items/${songId}`);
        xhr.send();
    }

    
}

var selectedNotes = ['-', '-', '-', '-', '-', '-', '-', '-', '-' ,'-', '-', '-', '-' ,'-', '-', '-'];

/**
 * Decodes the song from the song encoding if the song is being loaded from the database into the selected notes array 
 * @returns a copy of selectedNotes for testing reasons
 */
export function decodeSong(encoding){
    if(encoding.charAt(0) == 'S'){
        console.log("DECODING");
        var encodeIndex = 1;
        selectedNotes.forEach((note, i)=>{
            if(encoding.charAt(encodeIndex) == '-') encodeIndex++;
            else{
                selectedNotes[i] = encoding.substring(encodeIndex,encodeIndex+2);
                encodeIndex+=2;
            }
        })
    }
    return selectedNotes;
}



/**
 * Plays the song from the selected notes
 */
function playSong(){
    const now = context.currentTime;
    selectedNotes.forEach((note, i) => {
        instruments[selectedInstrument].start({ note, time: now + i/tempoFactor, duration: 0.5 });
    });
}

/**
 * Encodes the song data and adds the song with the name and tempo into the database
 */
function addSong(){
    console.log("add");
    var name = document.getElementById('titleInput').value;

    //sanitization
    if(name.length <1){
        alert("Please enter a name");
        return;
    }
    var specialPattern = /[^A-Za-z0-9 ]/
    if(specialPattern.test(name)){
        alert("No special characters allowed");
        return;
    }


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

/**
 * Deletes the song if the song was loaded from the database
 */
function deleteSong(){
    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", `https://va4kva7kjc.execute-api.us-east-2.amazonaws.com/items/${songId}`);
    xhr.send();
    console.log(xhr);
}


