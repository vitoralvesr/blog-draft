/* eslint-env browser */
/* global $ Site */

(function() { 

    var exports = {}

    exports.defaultMDEConfig = function(element) {
        return {
            element: element,
            spellChecker: false,
            renderingConfig: { codeSyntaxHighlighting: true },
            toolbar: undefined
        }
    }


    var fitHeight = function (element, offset) {
        offset = offset || 20
        var currentY = $(element).offset().top - window.pageYOffset
        element.style.height = (window.innerHeight - currentY - offset) + 'px'
    }


    exports.editorHack = function (editor) {

        var $toolbar = $('.editor-toolbar')

        setTimeout(function(){
            fitHeight(document.querySelector('.CodeMirror'), 100)
        },0)

        window.addEventListener('resize', function() {
            fitHeight(document.querySelector('.CodeMirror'), 100)
        })

        var addPictureEl =  $toolbar.find('.fa.fa-picture-o')[0]
        //let previousAddPictureEv = addPictureEl.onclick
        addPictureEl.onclick = function (event) {
            $.get('/assets/editor/media-modal.html').then(function (resp) {
                var $modal = $(resp)

                var $button = $modal.find('#uploadButton')
                var $input = $button.find('input[type=file]')
                $button.on('click', function () { 
                    $input[0].click()
                })
                $input.on('change', function () { 
                    var files = this.files
                    if (!(files && files.length)) return
                    var reader = new FileReader()
                    reader.onload = function (readerEv) {
                        Site.ajaxSendRaw(
                            'PUT',
                            '/api/file/' + encodeURIComponent(files[0].name),
                            readerEv.target.result
                        ).then(function () {
                            //TODO show message
                            return _populateList()
                        })
                        .catch(_handleError)
                    }
                    reader.readAsArrayBuffer(files[0])
                })


                $modal.modal('show')
                _populateList().catch(_handleError)

                
                function _populateList() {
                    return Site.ajaxRequest({
                        method: 'GET',
                        url : '/api/file'
                    })
                    .then(function (resp) { 
                        if (!resp.files) throw Error('Erro ao mostrar arquivos.')
                        if (!resp.files.length) {
                            $modal.find('.content').empty().append(
                                '<h1 style="margin:20px;color:#c5c5c5;text-align:center;">' +
                                'Nenhum conteúdo.' +
                                '</h1 >'
                            )
                            return
                        }
                        var html = $('<div class="ui four column grid stackable"></div>')
                        resp.files.forEach(function (file) {
                            var $el = $('<div class="column media-item">' +
                                '<img src="/media/thumbnails/' + file + '" class="img-upload">' +
                                '<div class="ui bottom left attached label filename-label">' + file + '</div>' +
                                '</img>' +
                                '</div>')
                            $el.on('click', function (event) { 
                                //var fn = previousAddPictureEv.bind(this)
                                //fn(event)
                                var absPath = '/media/' + file
                                var codeMirrorDoc = editor.codemirror.doc
                                codeMirrorDoc.replaceSelection('![descrição da imagem](' + absPath + ')\n')
                                $modal.modal('hide')
                            })
                            html.append($el)
                        })
                        $modal.find('.content').empty().append(html)
                    })
                }


                function _handleError(err) {
                    //TODO implement me
                    throw err
                }

            })
        }        

        if (window.innerWidth < 700) {
                //custom toolbar options were giving me trouble. Monkey-patch it.
                var $left = $toolbar.find('.fa.fa-quote-left')
                $left.next().remove()
                $left.next().remove()
                $left.remove()
                $toolbar.find('i.separator').remove()

                var $disable = $toolbar.find('.fa.fa-eye.no-disable')
                $disable.next().remove()
                var $newEl = $(
                    '<a title="Fullscreen" tabindex="-1" class="fa fa-arrows-alt no-disable"></a>'
                ).click(function(event) {
                    editor.toggleFullScreen()
                })
                $toolbar.find('.fa.fa-bold')
                    .before($disable)
                    .before($newEl)
                    .before('<i class="separator">|</i>')
                editor.toolbarElements.fullscreen = $newEl[0]
            }        
    }
    

    window.Editor = exports

})()