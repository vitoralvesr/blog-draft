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
                            var style = 'background-image: url(/media/thumbnails/'+ encodeURIComponent(file) +');'
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


    exports.initSubmitter = function ($element, isDraft, form) {
        var $submit = $element.find('.active-submit')
        var $dropdown = $element.find('.ui.floating.dropdown')
        var selected

        if (isDraft) toDraft()
        else toPublish()


        $element.find('.item[data-id=publish]').on('click', toPublish)
        $element.find('.item[data-id=draft]').on('click', toDraft)


        function toDraft() {
            selected = 'draft'
            form.elements.status.value = selected
            $submit.add($dropdown)
                .removeClass('primary')
                .addClass('teal')
            $submit.html('Salvar rascunho')
        }

        function toPublish() {
            selected = 'published'
            form.elements.status.value = selected
            $submit.add($dropdown)
                .removeClass('teal')
                .addClass('primary')
            $submit.html('Publicar')
        }
    }


    exports.localDraft = localDraft
    function localDraft(editor, edited, id, noLocalDraft) {
        id = id || 'NEW'

        if (id === 'NEW') (Site.submitHooks||[]).push(function(){
            localStorage.removeItem('article:NEW')
        })

        $('#revertBtn').hide()

        setInterval( function() {
            var tosave = {
                edited : new Date() ,
                content : editor.value()
            }
            localStorage.setItem('article:' + id , JSON.stringify(tosave))
            console.log('saved local draft')
        }, 1000 * 30)

        if (noLocalDraft) return

        loadDraft()

        let showNag = localStorage.getItem('once:localDraft')
        if (!showNag) {
            nagModal()
        }

        function nagModal() {
            var $modal = $(
                '<div class="ui small modal">'
                + '  <div class="header">Sobre o rascunho local</div>'
                + '  <div class="content">'
                + '    <p>O sistema automaticamente salva um rascunho do artigo'
                + '       de tempos em tempos, mesmo que você não tenha clicado em "Salvar" ou "Publicar".</p>'
                + '    <p>Caso queira ver a última versão que você mandou salvar (ao invés do último rascunho salvo), use o botão "Reverter".</p>'
                + '  </div>'
                + '  <div class="actions">'
                + '    <div class="ui approve primary button">OK</div>'
                + '  </div>'
                + '</div>')
            localStorage.setItem('once:localDraft', '1')
            $modal.modal('show')
        }


        $('#revertBtn').on('click', function(event) {
            var $modal = $(
                '<div class="ui small modal">'
                + '  <div class="header">Reverter</div>'
                + '  <div class="content">'
                + '    <p>Isto irá reverter seu texto para o último estado salvo no servidor.</p>'
                + '  </div>'
                + '  <div class="actions">'
                + '    <div class="ui approve primary button">OK</div>'
                + '    <div class="ui cancel button">Cancelar</div>'
                + '  </div>'
                + '</div>')

            $modal.find('.approve.button').on('click', function () {
                let current = window.location.href.split('?')[0]
                window.location.href = current + '?fresh=1'
            })

            $modal.modal('show')
        })


        function loadDraft() {
            var stored
            try {
                var raw = localStorage.getItem('article:' + id)
                stored = JSON.parse(raw)
            } catch(err) {
                return
            }
            if (!stored) return
            var savedTime = new Date(edited)
            var localstoredTime = new Date(stored.edited)
            //localstoredTime.setMinutes(localstoredTime.getMinutes() + _offset)
            if (localstoredTime.getTime() > (savedTime.getTime() || 0)) {
                editor.value(stored.content)
                if (id !== 'NEW') $('#revertBtn').show()
            }
        }
    }


    exports.showPostOptions = function (opts, mainCb) {
        var $modal = $(
            '<div class="ui small modal">'
            + '  <div class="header">Opções</div>'
            + '  <div class="content">'
            + '    <div class="ui form">'
            + '    </div>'
            + '  </div>'
            + '  <div class="actions">'
            + '    <div class="ui approve primary button">OK</div>'
            + '    <div class="ui cancel button">Cancelar</div>'
            + '  </div>'
            + '</div>')

        var callbacks = []

        if (opts.created) createdFn(opts.created)
        //isolate scope
        function createdFn(created) {
            var date = new Date(created)
            var formatted =
                date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear()
                + ' ' + date.getHours() + ':' + date.getMinutes()
            var $append = $(
                '<div class="field">'
                + '  <label>Alterar data de criação (dd/mm/yyyy hh:mm)</label>'
                + '  <input type="text"></input>'
                + '</div>');
            var $text = $append.find('input[type=text]')
            $text.val(formatted)
            $modal.find('.ui.form').append($append)

            callbacks.push(function (outp) {
                let datesplit = $text.val().split(/[\s:\/]/g)
                var date = new Date()
                date.setDate(Number(datesplit[0]))
                date.setMonth(Number(datesplit[1]) - 1)
                date.setFullYear(Number(datesplit[2]))
                date.setHours(Number(datesplit[3]))
                date.setMinutes(Number(datesplit[4]))
                outp.created = date
            })
        }

        mdBreakFn(opts.markdown_break)
        function mdBreakFn(markdown_break) {
            var $append = $(
                '<div class="field">'
                + '  <label>Markdown: quebrar linha com apenas 1 enter</label>'
                + '  <div class="ui checkbox">'
                + '    <input type="checkbox" name="allow_html"></input>'
                + '  </div>'
                + '</div>');
            var $cb = $append.find('.ui.checkbox')
            $cb.checkbox()
            $cb.checkbox(markdown_break == true ? 'set checked' : 'set unchecked')
            $modal.find('.ui.form').append($append)

            callbacks.push(function (obj) {
                obj.markdown_break = $cb.checkbox('is checked') ? '1' : ''
            })
        }

        $modal.find('.ui.approve').on('click', function () {
            var obj = {}
            callbacks.forEach(function (cb) {
                cb(obj)
            })
            mainCb(obj)
        })
        $modal.modal('show')
    }


    window.Editor = exports

})()