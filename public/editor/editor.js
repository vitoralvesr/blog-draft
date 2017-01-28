/* eslint-env browser */
/* global $ */

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

        let addPictureEl =  $toolbar.find('.fa.fa-picture-o')[0]
        let previousAddPictureEv = addPictureEl.onclick
        addPictureEl.onclick = function (event) {
            $.get('/assets/editor/media-modal.html').then(function (resp) {
                $(resp).modal('show')
            })

            previousAddPictureEv.bind(this)(event)
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