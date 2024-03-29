/*
* Autor: KJ
* Licencia: MIT - Copyright (c) 2020 KJ
* Web: https://kj2.me
*/

class TorrentList{
  constructor(){
    this.content      = document.querySelector('.content')
    this.breadcrumbs  = document.querySelector('#breadcrumbs')
    this.searchInput  = document.querySelector('#search-tl')
    this.path         = ''
    this.filesCurrent = []
    
    this.searchInput.onkeyup = function(event){
      if(event.which==27) this.searchInput.value = ''
      this.search(this.searchInput.value)
    }.bind(this)
    
    this.loadList()
  }
  
  /*
  * Cargar la lista de archivos desde files.json
  */
  loadList(){
    fetch('files.json').then(function(res){
      return res.json()
    }).then(function(res){
      this.filesCurrent = res[0].contents
      this.addBreadcrumb('Inicio', res[0].contents)
      this.showFiles(res[0].contents, '')
    }.bind(this))
  }
  
  /*
  * Imprime en this.content las carpetas y archivos que recibe
  */
  showFiles(files){
    this.content.innerHTML = ''
    files.forEach(function(file){

        let html  = document.createElement('div')
        let name  = document.createElement('div')
        let img   = document.createElement('img')
        img.src   = 'static/img/'+file.type+'.png'
        
        html.appendChild(img)
        html.appendChild(name)
        html.className = 'file-item'
        name.className = 'file-name'
        
        if (file.type=='directory'){
          name.innerText  = file.name
          html.onclick = function(){
            this.path        += file.name+'/'
            this.filesCurrent = file
            this.addBreadcrumb(file.name, file.contents)
            this.showFiles(file.contents)
          }.bind(this, file)
        }else{
          name.innerText  = file.name.slice(0,-8)
          html.onclick = function(){
            this.showInfo(file.name)
          }.bind(this)
        }
        
        this.content.appendChild(html)
    }.bind(this))
  }
  
  /*
  * Recibe una búsqueda, llama a una búsqueda recursiva e imprime
  * el resultado el resultado en html.
  */
  search(query){
    if (query.trim()=='' || query.length<3)
      return this.showFiles(this.filesCurrent)
      
    query = query.toUpperCase()
    console.log(this.filesCurrent)
    let result = this.recursiveSearch(this.filesCurrent, query)
    this.content.innerHTML = ''
    result.forEach(function(file){
      this.content.appendChild(file)
    }.bind(this))
  }
  
  recursiveSearch(files, query, path = []){
    let result = []
    console.log(path)
    files.forEach(function(file){
      if (file.name.toUpperCase().indexOf(query)>=0){
        let html  = document.createElement('div')
        let name  = document.createElement('div')
        let img   = document.createElement('img')
        img.src   = 'static/img/'+file.type+'.png'
        
        html.appendChild(img)
        html.appendChild(name)
        html.className = 'file-item'
        name.className = 'file-name'
      
        if (file.type=='directory'){
          name.innerText  = file.name
          html.onclick = function(){
            this.searchInput.value = ''
            path.forEach(function(dir){
              this.path        += dir.name+'/'
              this.addBreadcrumb(dir.name, dir.contents)
            }.bind(this))
            this.path        += file.name+'/'
            this.filesCurrent = file
            this.addBreadcrumb(file.name, file.contents)
            this.showFiles(file.contents)
          }.bind(this, file, path)
        }else{
          name.innerText  = file.name.slice(0,-8)
          html.onclick = function(){
            let route = ''
            path.forEach(function(dir){
              route        += dir.name+'/'
            }.bind(route))
            this.showInfo(route+file.name)
          }.bind(this)
        }
        result.push(html)
      }
      
      if (file.type=='directory'){
        let pathCopy = path.slice(0) // Hacemos una copia de "path"
        pathCopy.push(file)
        let subResult = this.recursiveSearch(file.contents, query, pathCopy)
        result = result.concat(subResult)
      }
      
    }.bind(this))
    return result
  }
  
  /*
  * Imprime la información de un torrent en una
  * ventana flotante.
  */
  showInfo(filename){
    fetch('files/'+this.path+filename).then(function(res){
      return res.blob()
    }).then(async function(res){
      let buf = Buffer.from(await loadFile(res))
      let byteArray = decode(buf)
      let torrent = bytearrayToString(Object.assign({}, byteArray))
      
      let totalSize = 0
      let filesHTML = ''
      let fileArr = []
      
      if (typeof(torrent.info.files)=="undefined"){
        totalSize = torrent.info.length
        filesHTML = this.fileHTML(torrent.info.name, torrent.info.length)
      } else {
        let root = torrent.info.name
        filesHTML = this.fileHTML(torrent.info.name)
        filesHTML.className = 'torrent-item directory expand' // Expandimos el primer directorio
        fileArr[root] = {'html': filesHTML, 'childs': []}
        torrent.info.files.forEach(function(file){
          totalSize = totalSize + file.length
          let actualIndex = fileArr[root]
          let count = 0
          while(file.path.length - 1 > count){
            let route = file.path[count]
            if (typeof(actualIndex.childs[route])=="undefined"){
              let newFile = this.fileHTML(route)
              actualIndex.html.appendChild(newFile)
              actualIndex.childs[route] = {'html': newFile, 'childs': []};
              actualIndex = actualIndex.childs[route]
            } else {
              actualIndex = actualIndex.childs[route]
            }
            count++
          }
          let route = file.path[count]
          let newFile = this.fileHTML(route, file.length)
          actualIndex.html.appendChild(newFile)
          actualIndex.childs[route] = {'html': newFile, 'childs': []};
        }.bind(this))
      }
      
      let floatWindow = document.createElement('div')
      let bgLayer     = document.createElement('div')
      let floatList   = document.createElement('div')
      let floatTitle  = document.createElement('h4')
      let dlButton    = document.createElement('button')
      let wtButton    = document.createElement('button')
      let closeButton = document.createElement('div')
      let titleList   = document.createElement('strong')
      
      bgLayer.className     = 'bglayer'
      floatWindow.className = 'floatWindow'
      floatTitle.className  = 'center'
      floatList.className   = 'floatList'
      titleList.className   = 'titleList'
      dlButton.className    = 'btn'
      wtButton.className    = 'btn'
      closeButton.className = 'close-btn'
      floatTitle.innerText  = 'Información de la descarga:'
      titleList.innerHTML   = 'Archivos del torrent - ('+this.textFileSize(totalSize)+')'
      dlButton.innerHTML    = 'Descargar<i class="material-icons right">arrow_drop_down_circle</i>'
      wtButton.innerHTML    = 'Webtorrent <i class="material-icons right">cloud</i>'
      closeButton.innerText = 'X'
      
      closeButton.onclick = bgLayer.onclick = function(){
        floatWindow.style.animation = "disapearJump 0.3s"
        bgLayer.remove()
        setTimeout(function(){
          floatWindow.remove()
        }.bind(floatWindow, bgLayer), 250)
      }
      
      dlButton.onclick = function(){
        this.download(filename)
      }.bind(this)
      
      wtButton.onclick = function(){
        let a        = document.createElement('a')
            a.target = '_blank'
            a.href   = 'dl.html#'+btoa('files/'+this.path+filename)
            a.click()
      }.bind(this)
      
      floatList.appendChild(filesHTML)
      floatWindow.appendChild(floatTitle)
      floatWindow.appendChild(titleList)
      floatWindow.appendChild(floatList)
      if (typeof(torrent.info.files)=="undefined" && this.isWebtorrent(torrent)) // Solo mostrar si es un solo archivo y es webtorrent
        floatWindow.appendChild(wtButton)
      floatWindow.appendChild(dlButton)
      floatWindow.appendChild(closeButton)
      document.body.appendChild(bgLayer)
      document.body.appendChild(floatWindow)
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
  * Genera el html de un archivo para "showInfo"
  */
  fileHTML(name, size = ''){
    let file = document.createElement('div')
    let filename = document.createElement('span')
    let icon = document.createElement('i')
    file.appendChild(icon)
    file.appendChild(filename)
    if (size == ''){
      filename.innerText  = name
      file.className      = 'torrent-item directory shrink' 
      icon.innerHTML      = 'folder'
      icon.className = "material-icons circle yellow-text"
      icon.onclick = filename.onclick = function(){
        if (file.className.indexOf('shrink')>-1){
          file.className = file.className.replace('shrink', 'expand')
        } else {
          file.className = file.className.replace('expand', 'shrink')
        }
      }.bind(file)
    }else{
      filename.innerText  = name+' - ( '+this.textFileSize(size)+' )'
      file.className      = 'torrent-item file'
      icon.innerHTML      = 'insert_drive_file'
      icon.className = "material-icons circle white-text"
    }
    return file;
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
        finalSize = Math.floor(size/(1024*1024))+parseFloat('0.'+Math.floor((size%(1024*1024))*100/(1024*1024)))
        meterage = 'MiB'
        if (finalSize>1024){
          finalSize = Math.floor(size/(1024*1024*1024))+parseFloat('0.'+Math.floor((size%(1024*1024*1024)*100/(1024*1024*1024))))
          meterage = 'GiB'
        }
      }
    }
    return finalSize+meterage
  }
  
  /*
  * Descargar torrent
  */
  download(filename){
    location.href = 'files/'+this.path+filename
  }
  
  /*
  * Añade un elemento más a la barra superior
  */
  addBreadcrumb(name, files){
    let breadcrumb       = document.createElement('div')
    let actualPath       = this.path
    let actualFiles      = this.filesCurrent
    
    breadcrumb.className = 'breadcrumb'
    breadcrumb.innerText = name
    
    breadcrumb.onclick = function(){
      this.showFiles(files)
      this.path         = actualPath
      this.filesCurrent = actualFiles
      this.clearBreacumbs(breadcrumb)
    }.bind(this)
    
    this.breadcrumbs.appendChild(breadcrumb)
  }
  
  /*
  * Elimina los breadcrumbs desde el nodo "from"
  */
  clearBreacumbs(from){
    let startClear = false
    let nodes = Array.from(this.breadcrumbs.childNodes)
    nodes.forEach(function(child){
      if (startClear){
        child.remove()
      }else{
        if (from.isSameNode(child)){
          startClear = true
        }
      }
    })
  }
}

let tl = new TorrentList()
