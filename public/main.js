/* eslint-env browser */
/* global $, SimpleMDE */

(function() {
    var exports = {}


    var _submitting = false
    /**
     * Expects declared in the form element
     *   - data-url
     *   - data-method
     *   - data-redirect-to
     *
     * @param {HTMLFormElement} formEl
     */
    function submitForm( formEl, opts ) {
        opts = opts || {}
        event.preventDefault()
        if (!$(formEl).form('is valid')) return
        if (_submitting) return

        if (!(
            document.activeElement.tagName === 'INPUT' && 
            document.activeElement.type === 'submit')) {
            return
        }

        _submitting = true
        var formItems =
            Array.from(document.forms.namedItem(formEl.name).elements)
                .filter( element => {
                    if (element.tagName === 'INPUT' && element.type === 'submit') return false
                    return ['INPUT', 'SELECT', 'TEXTAREA'].indexOf(element.tagName) != -1
                })

        let objectToSend = formItems.reduce((previous, current) => {
            previous[current.name] = current.value
            if (current.tagName === 'INPUT' && current.type === 'checkbox') {
                previous[current.name] = current.checked ? '1' :  '0'
            }
            return previous
        }, {})        

        if (opts.editData) objectToSend = opts.editData(objectToSend)

        let submitBtn = formEl.querySelector('input[type="submit"]')
        $(submitBtn).removeClass('primary')
        let prevValue = submitBtn.value
        submitBtn.value = 'Enviando'

        let _hidebtnfn = () => {
            formEl.querySelector('.ui.message.error').style.display = 'none'
        }
        ajaxRequest({
            method : formEl.dataset.method,
            url : formEl.dataset.url ,
            body : objectToSend
        }).then(() => {
            submitBtn.value = 'Salvo!'
            $(submitBtn).addClass('primary')            
            setTimeout(function () { 
                submitBtn.value = prevValue
            }, 2000)
            _submitting = false            
            if (formEl.dataset.redirectTo) {
                window.location.pathname = formEl.dataset.redirectTo
                return
            }
        })
        .catch( function(err) {
            _submitting = false
            submitBtn.value = prevValue
            let innerp = formEl.querySelector('.ui.message.error > p')
            if (!innerp) {
                innerp = document.createElement('P')
                formEl.querySelector('.ui.message.error').appendChild(innerp)
            }
            innerp.innerText = (err.error && err.error.message) || err.message || err
            formEl.querySelector('.ui.message.error').style.display = 'block'
            let hideBtn = formEl.querySelector('.ui.message.error > .close.icon')
            hideBtn && hideBtn.addEventListener('click', _hidebtnfn)
            throw err
        })
    }
    exports.submitForm = submitForm


    function populateForm(formEl, valuesObj) {
        for (var it in valuesObj) {
            var field = formEl.elements[it]
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = valuesObj[it] == true
                }
                else field.value = valuesObj[it]
            }
        }
    }
    exports.populateForm = populateForm


    function ajaxRequest(params) {
        var method = params.method
        var url = params.url
        var body = params.body
        return new Promise(function (resolve, reject) {
            body = body || {}
            let req = new XMLHttpRequest()
            req.open(method||'POST', url)
            if (typeof body == 'object') {
                req.setRequestHeader('content-type', 'application/json')
                req.send(JSON.stringify(body))
                req.addEventListener('load', function() {
                    if (req.statusText == 'OK') {
                        try {
                            let parsed = JSON.parse(req.responseText)
                            if (!parsed.error) return resolve(parsed)
                            reject(parsed)
                        } catch(e) {
                            reject({ error : Error('non JSON response at ajaxRequest') })
                        }
                    } else {
                        try {
                            reject(JSON.parse(req.responseText))    
                        } catch(e) {
                            reject({ error : Error(req.responseText)})
                        }                        
                    }
                })
            } else {
                return reject(Error('expects JSON body'))
            }
        })
    }
    exports.ajaxRequest = ajaxRequest


    function ajaxHtml(params) {
        var url = params.url
        return new Promise(function (resolve, reject) {
            let req = new XMLHttpRequest()
            req.open('GET', url)
            req.send()
            req.addEventListener('load', function() {
                if (req.statusText == 'OK') {
                    return resolve(req.responseText)
                } else {
                    reject({ error : Error(req.responseText)})
                }
            })
        })        
    }
    exports.ajaxHtml = ajaxHtml


    exports.findParentField = function(element) {
        var $el = $(element)
        while (!$el.hasClass('field')) {
            $el = $el.parent()
        }
        return $el
    }

    exports.logout = function() {
        exports.ajaxRequest({method:'GET', url:'/api/user/logout'}).then(() => {
            window.location.reload()
        })
    }

    
    exports.defaultMDEConfig = function(element) {
        return {
            element: element,
            spellChecker: false,
            renderingConfig: { codeSyntaxHighlighting: true },
            toolbar: [
                {
                    "name": "bold",
                    "action": SimpleMDE.toggleBold,
                    "title": "Negrito",
                    "className": "fa fa-bold"
                },
                {
                    "name": "italic",
                    "action": SimpleMDE.toggleItalic,
                    "title": "Itálico",
                    "className": "fa fa-italic"
                },
                {
                    "name": "strikethrough",
                    "action": SimpleMDE.toggleStrikethrough,
                    "title": "Tachado",
                    "className": "fa fa-strikethrough"
                },
                "|",
                {
                    "name": "heading",
                    "action": SimpleMDE.toggleHeadingSmaller,
                    "title": "Título",
                    "className": "fa fa-header"
                },
                {
                    name: "quote",
                    action: SimpleMDE.toggleBlockquote,
                    title: "Citação",
                    "className" : "fa fa-quote-left no-mobile"
                } ,
                "|",
                {
                    "name": "unordered-list",
                    "action": SimpleMDE.toggleUnorderedList,
                    "title": "Tópicos",
                    "className": "fa fa-list-ul"
                },
                {
                    "name": "ordered-list",
                    "action": SimpleMDE.toggleOrderedList,
                    "title": "Lista numerada",
                    "className": "fa fa-list-ol"
                },
                "|",
                {
                    "name": "link",
                    "action": SimpleMDE.drawLink,
                    "title": "Link",
                    "className": "fa fa-link"
                },
                {
                    "name": "image",
                    "action": SimpleMDE.drawImage,
                    "title": "Imagem",
                    "className": "fa fa-picture-o"
                },
                {
                    "name": "table",
                    "action": SimpleMDE.drawTable,
                    "title": "Tabela",
                    "className": "fa fa-table"
                },
                "|" ,
                {
                    "name": "side-by-side",
                    "action": SimpleMDE.toggleSideBySide,
                    "title": "Previsão",
                    "className": "fa fa-eye no-disable no-mobile"
                },
                {
                    "name": "fullscreen",
                    "action": SimpleMDE.toggleFullScreen,
                    "title": "Tela cheia",
                    "className": "fa fa-arrows-alt no-disable"
                },
                {
                    "name": "guide",
                    "action": function () { 
                        window.open('/assets/markdown-guide.html')
                    },
                    "title": "Ajuda",
                    "className": "fa fa-question-circle no-mobile"
                }
            ]
        }
    }


    exports.fitHeight = function (element, offset) {
        offset = offset || 20
        var currentY = $(element).offset().top - window.pageYOffset
        element.style.height = (window.innerHeight - currentY - offset) + 'px'
    }

    window.Site = exports

    $(function() {
        $('pre').addClass('ui segment')
        $('.ui.menu .ui.dropdown.item').dropdown()        
    })



})()