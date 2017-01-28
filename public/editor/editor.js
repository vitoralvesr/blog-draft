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
            $.get('/assets/editor/editor-modal.html').then(function (resp) {
                var $modal = $(resp)

                var $button = $modal.find('#uploadButton')
                var $input = $button.find('input[type=file]')
                var $delete = $modal.find('#imgDeleteButton')
                var $content = $modal.find('#content')

                $button.on('click', function () {
                    $input[0].click()
                })

                $input.on('change', function () {
                    var files = this.files
                    if (!(files && files.length)) return
                    var reader = new FileReader()
                    reader.onload = function (readerEv) {
                        $content.dimmer('show')
                        Site.ajaxSendRaw(
                            'PUT',
                            '/api/file/' + encodeURIComponent(files[0].name),
                            readerEv.target.result
                        ).then(function () {
                            $content.dimmer('hide')
                            //TODO show message
                            return _populateList()
                        })
                        .catch(_handleError)
                    }
                    reader.readAsArrayBuffer(files[0])
                })

                var _iconsActive = false
                $delete.on('click', function (event) {
                    if (_iconsActive) return
                    _iconsActive = true
                    $modal.find('#content .inner .media-item').append(
                        '<div class="ui top right attached red label remove" style="width:35px"><i class="icon remove"></i></div>'
                    ).on('click', function(event) {
                        $content.dimmer('show')
                        Site.ajaxRequest({
                            method: 'DELETE',
                            url: '/api/file/' + encodeURIComponent($(this).attr('data-file'))
                        }).then(function () { 
                            _populateList()
                            $content.dimmer('hide')
                        })
                        .catch(_handleError)
                    })
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
                            $modal.find('#content .inner').empty().append(
                                '<h1 style="margin:20px;color:#c5c5c5;text-align:center;">' +
                                'Nenhum conteúdo.' +
                                '</h1 >'
                            )
                            return
                        }
                        var html = $('<div class="ui four column grid stackable"></div>')
                        resp.files.forEach(function (file) {
                            var style = 'background-image: url(/media/thumbnails/'+ file +');'
                                + 'background-repeat: no-repeat;'
                                + 'background-size: contain;'
                                + 'background-position: top;'
                                + 'height:130px;'
                                + 'margin:15px;'
                                + 'cursor:pointer;'

                            var $el = $('<div class="column media-item" style="'+ style +'">' +
                                '<div class="ui bottom left attached label filename-label" style="bottom:-15px">' + file + '</div>' +
                                '</div>')
                            $el.attr('data-file', file)
                            $el.on('click', function (event) {
                                if ($(event.target).hasClass('remove')) {
                                    return false
                                }
                                //var fn = previousAddPictureEv.bind(this)
                                //fn(event)
                                var absPath = '/media/' + file
                                var codeMirrorDoc = editor.codemirror.doc
                                codeMirrorDoc.replaceSelection('![descrição da imagem](' + absPath + ')\n')
                                $modal.modal('hide')
                            })
                            html.append($el)
                            _iconsActive = false
                        })
                        $modal.find('#content .inner').empty().append(html)
                    })
                }


                function _handleError(err) {
                    $content.dimmer('hide')                    
                    var $error = $modal.find('.ui.error')
                    $error.removeClass('hidden')
                    $error.find('.content').html(err.error.message)
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