/* eslint-env browser */
/* global $, SimpleMDE, editor */

(function() {
    var exports = {}


    var _submitting = false

    exports.jsonForm = jsonForm    
    function jsonForm(formEl, opts) {


        //override all submit events on this shit
        formEl.onsubmit = function (event) { 
            opts = opts || {}
            event.preventDefault()
            if (!$(formEl).form('is valid')) return
            if (_submitting) return

            if (!(
                document.activeElement.tagName === 'INPUT' && 
                document.activeElement.type === 'submit')) {
                return false
            }

            _submitting = true
            var formItems =
                Array.from(formEl.elements)
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
                method : opts.method || formEl.dataset.method,
                url : opts.url || formEl.dataset.url ,
                body : objectToSend
            }).then(() => {
                submitBtn.value = 'Salvo!'
                $(submitBtn).addClass('primary')            
                setTimeout(function () { 
                    submitBtn.value = prevValue
                }, 2000)
                _submitting = false            
                if (opts.redirectTo || formEl.dataset.redirectTo) {
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
            return false            
        }
    }


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
            toolbar: undefined
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