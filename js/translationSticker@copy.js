'use strict';
(function () {
    var WIDTH_WIN = window.innerWidth;      //浏览器窗口宽度

    var $BODY = document.body;

    //工具方法
    var utils = {
        hasClass: function (dom, cls) {
            return dom.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)', 'ig'));
        },
        addClass: function (dom, cls) {
            if (!utils.hasClass(dom, cls))dom.className += ' ' + cls;
            return this;
        },
        removeClass: function (dom, cls) {
            if (utils.hasClass(dom, cls)) {
                var reg = new RegExp('(\\s|^)' + cls, 'ig');
                dom.className = dom.className.replace(reg, '');
            }
            return this;
        },
        toggleClass: function (dom, cls) {
            if (utils.hasClass(dom, cls)) {
                utils.removeClass(dom, cls);
            }
            else {
                utils.addClass(dom, cls);
            }
        }
    };

    //获取页面选中的文字
    function getSelectionText() {
        var text = window.getSelection().toString();
        return text.replace(/(^\s*)|(\s*$)/ig, '');
    }

    //设置选中文字高亮
    function setTextHighLight() {
        this.range = window.getSelection().getRangeAt(0);
        var selectionContents = this.range.extractContents();
        this.$span = document.createElement('span');
        this.$span.appendChild(selectionContents);
        this.$span.setAttribute('class', 'text-high-light');
        this.range.insertNode(this.$span);
    }

    //清除页面中发高亮文字
    function clearTextHighLight() {
        this.range.insertNode(document.createTextNode(this.text));
        this.$span.remove();
    }

    //判断是否为单词
    function isWord(text) {
        return /\w/.test(text);
    }

    //消抖函数
    function debounce(cb, delay) {
        clearTimeout(debounce.timer);
        debounce.timer = setTimeout(function () {
            cb();
        }, delay || 300);
    }

    //主构造函数
    function TranslationSticker() {
        this.isLoading = false;
        this.isStickerShow = false;
        this.requestStack = [];
        this.init();
    }

    //原型
    TranslationSticker.prototype = {
        constructor: TranslationSticker,
        //初始化
        init: function () {
            this._createTranslationSection();
            this.bindEvents();
        },
        //创建翻译框
        _createTranslationSection: function () {
            this.$sticker = document.createElement('div');
            this.$sticker.className = 'translation-sticker hide';
            var str = '';
            str += '<div class="panel">';
            str += '    <a href="javascript:;" class="btn-close"></a>';
            str += '    <div class="panel-bd">';
            str += '        <p class="dictionary-uk"></p>';
            str += '        <p class="dictionary-us"></p>';
            str += '        <p class="dictionary-comment"></p>';
            str += '    </div>';
            str += '<div>';
            this.$sticker.innerHTML = str;
            this.$btnClose = this.$sticker.querySelector('.btn-close');
            this.$uk = this.$sticker.querySelector('.dictionary-uk');
            this.$us = this.$sticker.querySelector('.dictionary-us');
            this.$comment = this.$sticker.querySelector('.dictionary-comment');
            $BODY.appendChild(this.$sticker);
        },
        _createAudio: function (src) {
            if (this.$audio)this.$audio.remove();
            this.$audio = document.createElement('audio');
            this.$audio.setAttribute('controls', 'controls');
            this.$audio.style.display = 'none';
            var $source = document.createElement('source');
            $source.setAttribute('type', 'audio/mpeg');
            $source.src = src;
            this.$audio.appendChild($source);
            $BODY.appendChild(this.$audio);
            this.bindEventsAudio();
        },
        //获取坐标
        _getXY: function () {
            var bodyOffset = {
                scrollTop: $BODY.scrollTop
            };

            var stickerOffset = {
                height: this.$sticker.offsetHeight,
                width: this.$sticker.offsetWidth
            };
            var textOffset = {
                height: this.$span.offsetHeight,
                width: this.$span.offsetWidth,
                left: this.$span.offsetLeft + this.$span.offsetWidth / 2,
                top: this.$span.offsetTop - bodyOffset.scrollTop
            };
            var x, y;
            //判断左右溢出
            if ((textOffset.left + stickerOffset.width / 2) > WIDTH_WIN) {
                x = textOffset.left - stickerOffset.width;
            }
            else if ((textOffset.left - stickerOffset.width / 2) < 0) {
                x = textOffset.left;
            }
            else {
                x = textOffset.left - stickerOffset.width / 2;
            }
            //判断上下溢出
            if ((textOffset.top - stickerOffset.height) < 0) {
                y = textOffset.top + textOffset.height;
            }
            else {
                y = textOffset.top - stickerOffset.height;
            }
            return {
                x: x,
                y: y
            }
        },
        _setStickerPosition: function () {
            this.pos = this._getXY();
            this.$sticker.style.top = this.pos['y'] + 'px';
            this.$sticker.style.left = this.pos['x'] + 'px';
        },
        //隐藏翻译框
        _hide: function () {
            this.isStickerShow = false;
            clearTextHighLight.call(this);
            utils.removeClass(this.$sticker, 'show')
                .addClass(this.$sticker, 'hide');
        },
        //显示翻译框
        _show: function () {
            this.isStickerShow = true;
            setTextHighLight.call(this);
            utils.removeClass(this.$sticker, 'hide')
                .addClass(this.$sticker, 'show');
            this._setStickerPosition();
        },
        //sticker开始渲染
        _render: function () {
            this.data = this.response['data'];
            this.pronunciations = this.data['pronunciations'] || {};
            var _ukData = this.pronunciations['uk'] || null;
            var _usData = this.pronunciations['us'] || null;
            var _comment = this.data['definition'];
            if (_ukData) {
                this.$uk.innerHTML = '<span>英 [' + _ukData + ']</span><i class="icon-horn" data-audio-src="' + this.data['audio_addresses']['uk'][1] + '"></i>';
            }
            if (_usData) {
                this.$us.innerHTML = '<span>美 [' + _usData + ']</span><i class="icon-horn" data-audio-src="' + this.data['audio_addresses']['us'][1] + '"></i>';
            }
            if (_comment) {
                this.$comment.innerHTML = this.data['definition'];
            }
            this._show();
        },
        //发送请求
        _sendPost: function () {
            var self = this;
            var now = +new Date();
            var xhr = new XMLHttpRequest();
            var url = 'https://api.shanbay.com/bdc/search/?' + 'word=' + this.text;
            xhr.open('GET', url, true);
            xhr.addEventListener('readystatechange', function () {
                if (this.readyState === 4) {
                    self.requestStack = self.requestStack.filter(function (request) {
                        return request !== now;
                    });
                    if ((this.status >= 200 && this.status < 300) || this.status == 304) {
                        if (this.responseText) {
                            self.response = JSON.parse(this.responseText);
                            self.isLoading = false;
                            !self.requestStack.length && self._render();
                        }
                    }
                }
            });
            xhr.send(null);
            this.isLoading = true;
            this.requestStack.push(now);
        },
        //绑定事件
        bindEvents: function () {
            var self = this;
            $BODY.addEventListener('mouseup', function (e) {
                debounce(function () {
                    //获取已选中的内容
                    var text = getSelectionText();
                    //当选中的内容不为空且内容中不包含空格
                    //一般默认包含空格的内容为语句,不包含空格的内容为单词
                    self.isStickerShow && self._hide();
                    if (text && isWord(text)) {
                        self.text = text;
                        self._sendPost();
                    }
                });
            });
            window.addEventListener('scroll', function (e) {
                debounce(function () {
                    self._setStickerPosition();
                }, 30);
            });
            //绑定语音事件
            [this.$uk, this.$us].forEach(function (dom) {
                dom.addEventListener('click', function () {
                    var src = dom.querySelectorAll('.icon-horn')[0].getAttribute('data-audio-src');
                    self._createAudio(src);
                }, false);
            });
            //sticker事件阻止冒泡
            this.$sticker.addEventListener('mouseup', function (e) {
                e.stopPropagation();
            });
            //绑定关闭事件
            this.$btnClose.addEventListener('click', function (e) {
                e.stopPropagation();
                self._hide();
            }, false);
        },
        //绑定语音播放事件
        bindEventsAudio: function () {
            this.$audio.addEventListener('canplaythrough', function () {
                this.$audio.play();
            }.bind(this));
            this.$audio.addEventListener('ended', function () {
                this.$audio.remove();
            }.bind(this));
        }
    };

    window.TranslationSticker = TranslationSticker;

}());

new TranslationSticker();