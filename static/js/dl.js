/*
* Autor: KJ
* Licencia: MIT - Copyright (c) 2020 KJ
* Web: https://kj2.me
*/

class WebtorrentDownload{
  
  constructor(){
    this.content      = document.querySelector('.content')
    this.torrentParam = this.getTorrentParam()
    
    // Elementos HTML
    this.filename     = document.querySelector('#filename')
    this.filesize     = document.querySelector('#filesize')
    this.percent      = document.querySelector('#percent')
    this.determinate  = document.querySelector('.determinate')
    this.status       = document.querySelector('#status')
    this.peers        = document.querySelector('#peers')
    this.downSpeed    = document.querySelector('#downSpeed')
    this.upSpeed      = document.querySelector('#upSpeed')
    this.eta          = document.querySelector('#eta')
    
    if (!this.torrentParam){
      return this.content.innerHTML = '<h4>No se ha especificado un archivo para descargar.</h4>'
    }
    this.loadTorrent()
  }
  
  /*
  * Carga el archivo .torrent y llama a la función que muestra e inicia la descarga.
  */
  loadTorrent(){
    fetch(this.torrentParam).then(function(res){
      return res.blob()
    }).then(async function(res){
      this.torrentBuf       = Buffer.from(await loadFile(res))
      let byteArray = decode(this.torrentBuf)
      let torrent   = bytearrayToString(Object.assign({}, byteArray))
      
      if (typeof(torrent.info.files)=="undefined" && this.isWebtorrent(torrent)){
        this.download(torrent)
      } else {
        return this.content.innerHTML = '<h4>Archivo no válido.</h4>'
      }
    }.bind(this))
  }
  
  /*
  * Obtiene y decodifica el parámetro de la url que está luego de #
  * en caso de no encontrar el parámetro, devuelve false.
  */
  getTorrentParam(){
    if (/dl.html#([A-Za-z0-9+/=]+)/.test(location.href)) 
      return atob(location.href.match('dl.html#([A-Za-z0-9+/=]+)')[1])
    return false
  }
  
  /*
  * Recibe el objeto de torrent, muestra el nonbre y peso en pantalla, para luego
  * iniciar la descarga webtorrent e ir actualizando las stats.
  */
  
  download(torrentObj){
    this.filename.innerText = torrentObj.info.name
    this.filesize.innerText = this.textFileSize(torrentObj.info.length)
    
    this.downloader = new WebTorrent()
    
    this.downloader.add(this.torrentBuf, function(torrent){
      this.status.innerText = "Descargando"
      
      /*torrent.on('download', function (bytes) {
        console.log('just downloaded: ' + bytes)
        console.log('total downloaded: ' + torrent.downloaded)
        console.log('download speed: ' + torrent.downloadSpeed)
        console.log('progress: ' + torrent.progress)
        console.log('ETA: ' + torrent.timeRemaining)
      })
      
      torrent.on('upload', function (bytes) {
        console.log('just uploaded: ' + bytes)
      })*/
      
      let updater = setInterval(function(){
        this.percent.innerText        = Math.floor(torrent.progress*100)+'%'
        this.determinate.style.width  = Math.floor(torrent.progress*100)+'%'
        this.peers.innerText          = torrent.numPeers
        this.downSpeed.innerText      = this.prettyBytes(torrent.downloadSpeed)+'/s'
        this.upSpeed.innerText        = this.prettyBytes(torrent.uploadSpeed)+'/s'
        this.eta.innerText            = ''
        
        let seconds   = Math.floor((torrent.timeRemaining / 1000) % 60)
        let minutes   = Math.floor((torrent.timeRemaining / (1000 * 60)) % 60)
        let hours     = Math.floor(torrent.timeRemaining / (1000 * 60 * 60) % 1000000)
        
        if (hours>0)
          this.eta.innerText = hours+'h'
         
        if (minutes>0)
          this.eta.innerText += ' '+minutes+'m'
        
        if (seconds>0)
          this.eta.innerText += ' '+seconds+'s'
          
      }.bind(this),500);
      
      var streamable = torrent.files.find(function (file) {
          return file.name.endsWith('.mp4')
      })
      
      if (typeof(streamable)!="undefined"){
        streamable.appendTo('#player')
      }
      
      torrent.on('done', function(){
        clearInterval(updater)
        
        this.status.innerText         = "Finalizado"
        this.percent.innerText        = '100%'
        this.determinate.style.width  = '100%'
        this.downSpeed.innerText      = '0 B/s'
        this.eta.innerText            = '0'
        
        torrent.files.forEach(function(file){
          file.getBlobURL(function (err, url) {
            if (err) throw err
            var a = document.createElement('a')
            a.download = file.name
            a.href = url
            a.click()
          })
        })
      }.bind(this))
    }.bind(this))
  }
  
  /*
  * Recibe un objeto javascript con los datos del torrent
  * y revisa si tiene algún tracker Websocket para saber
  * si puede o no funcionar como WebTorrent.
  */
  
  isWebtorrent(torrent){
    if (typeof(torrent.announce) != "undefined" && 
       (torrent.announce.substr(0,5) == 'ws://' ||
        torrent.announce.substr(0,6) =='wss://')){
      return true
    }
    
    let result = false

    if (typeof(torrent['announce-list']) != "undefined"){
      torrent['announce-list'].forEach(function(announce){
        if (announce[0].substr(0,5) == 'ws://' || 
            announce[0].substr(0,6) =='wss://' ) {
          result = true    
        }
      })
    }
    
    return result
  }
  
  /*
  * Recibe el un tamaño en bytes y devuelve el valor en modo texto
  * con su respectiva medida (Bytes, KiB, MiB y GiB).
  */
  
  textFileSize(size){
    let meterage = 'Bytes'
    let finalSize = size
    if (finalSize>1024){
      finalSize = Math.floor(size/1024)+parseFloat('0.'+Math.floor((size%1024)*100/1024))
      meterage = 'KiB'
      if (finalSize>1024){
        finalSize = Math.floor(size/(1024*1024))+
                    parseFloat('0.'+Math.floor((size%(1024*1024))*100/(1024*1024)))
        meterage = 'MiB'
        if (finalSize>1024){
          finalSize = Math.floor(size/(1024*1024*1024))+
                      parseFloat('0.'+Math.floor((size%(1024*1024*1024)*100/(1024*1024*1024))))
          meterage = 'GiB'
        }
      }
    }
    return finalSize+meterage
  }
  
  /*
  * Esta función no la hice yo, pero me pareció genial, así que la agrego a pesar de que 
  * podría hacerlo yo mismo.
  */
  prettyBytes(num) {
    var exponent, unit, neg = num < 0, units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    if (neg) num = -num
    if (num < 1) return (neg ? '-' : '') + num + ' B'
    exponent = Math.min(Math.floor(Math.log(num) / Math.log(1000)), units.length - 1)
    num = Number((num / Math.pow(1000, exponent)).toFixed(2))
    unit = units[exponent]
    return (neg ? '-' : '') + num + ' ' + unit
  }
}

const wd = new WebtorrentDownload()
