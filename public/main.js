/* eslint-env browser */
/* global $ */

(function() {
    var exports = {}


    var _submitting = false
    /**
     * Expects declared in the form element
     *   - data-url
     *   - data-method
     *   - data-redirect-to
     * @param {HTMLFormElement} formEl
     */
    function submitForm( formEl ) {
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
            return previous
        }, {})        

        let submitBtn = formEl.querySelector('input[type="submit"]')
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
            window.location.pathname = formEl.dataset.redirectTo
            _submitting = false
            submitBtn.value = prevValue
        })
        .catch(err => {
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
            hideBtn.addEventListener('click', _hidebtnfn)
            throw err
        })
    }
    exports.submitForm = submitForm


    function ajaxRequest( {method, url, body} ) {
        return new Promise((resolve, reject) => {
            body = body || {}
            let req = new XMLHttpRequest()
            req.open(method||'POST', url)
            if (typeof body == 'object') {
                req.setRequestHeader('content-type', 'application/json')
                req.send(JSON.stringify(body))
                req.addEventListener('load', () => {
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

    window.Site = exports

    $(function() {
        $('.article-content table').addClass('ui collapsing padded table')
        $('.article-content code > div.highlight').addClass('ui segment secondary')        
    })

})()