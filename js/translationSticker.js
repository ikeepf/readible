/*
 * name: translation sticker
 * description: 划词翻译
 * author: lihao
 **/
(function () {
    'use strict';
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
        },
        //消抖函数
        debounce: function (cb, delay) {
            clearTimeout(utils.debounce.timer);
            utils.debounce.timer = setTimeout(function () {
                cb();
            }, delay || 300);
        }
    };

    //获取页面选中的文字
    function getSelectionText() {
        var text = window.getSelection().toString().replace(/(^\s*)|(\s*$)/ig, '');
        if (text) {
            this.range = window.getSelection().getRangeAt(0);
            this.clientRect = this.range.getBoundingClientRect();
        }
        return text;
    }

    //判断是否为单词
    function isWord(text) {
        return /\w/.test(text);
    }

    //主构造函数
    function TranslationSticker() {
        this.isLoading = false;
        this.isStickerShow = false;
        this.init();
    }

    //原型
    TranslationSticker.prototype = {
        constructor: TranslationSticker,
        //初始化
        init: function () {
            this.createTranslationSection();
            this.bindEvents();
        },
        //创建翻译框
        createTranslationSection: function () {
            this.$sticker = document.createElement('div');
            this.$sticker.className = 'translation-sticker hide';
            var str = '';
            str += '<div class="panel">';
            str += '    <a href="javascript:;" class="btn-close"></a>';
            str += '    <div class="panel-bd">';
            str += '        <p class="selected-text"></p>';
            str += '        <p class="dictionary-uk"></p>';
            str += '        <p class="dictionary-us"></p>';
            str += '        <p class="dictionary-comment"></p>';
            str += '    </div>';
            str += '<div>';
            this.$sticker.innerHTML = str;
            this.$btnClose = this.$sticker.querySelector('.btn-close');
            this.$text = this.$sticker.querySelector('.selected-text');
            this.$uk = this.$sticker.querySelector('.dictionary-uk');
            this.$us = this.$sticker.querySelector('.dictionary-us');
            this.$comment = this.$sticker.querySelector('.dictionary-comment');
            $BODY.appendChild(this.$sticker);
        },
        createAudio: function (src) {
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
        getXY: function () {
            var stickerClientRect = {
                height: this.$sticker.offsetHeight,
                width: this.$sticker.offsetWidth
            };
            var x, y;
            //判断左右溢出
            if ((this.clientRect.left + stickerClientRect.width / 2) > WIDTH_WIN) {
                x = this.clientRect.left - stickerClientRect.width;
            }
            else if ((this.clientRect.left - stickerClientRect.width / 2) < 0) {
                x = this.clientRect.left;
            }
            else {
                x = this.clientRect.left - stickerClientRect.width / 2;
            }
            //判断上下溢出
            if ((this.clientRect.top - stickerClientRect.height) < 0) {
                y = this.clientRect.top + this.clientRect.height;
            }
            else {
                y = this.clientRect.top - stickerClientRect.height;
            }
            return {
                x: x,
                y: y
            }
        },
        setStickerPosition: function () {
            this.pos = this.getXY();
            this.$sticker.style.top = this.pos['y'] + 'px';
            this.$sticker.style.left = this.pos['x'] + 'px';
        },
        //隐藏翻译框
        hide: function () {
            this.isStickerShow = false;
            utils.removeClass(this.$sticker, 'show')
                .addClass(this.$sticker, 'hide');
        },
        //显示翻译框
        show: function () {
            this.isStickerShow = true;
            this.setStickerPosition();
            utils.removeClass(this.$sticker, 'hide')
                .addClass(this.$sticker, 'show');
        },
        //sticker开始渲染
        render: function () {
            this.data = this.response['data'];
            this.pronunciations = this.data['pronunciations'] || {};
            var _ukData = this.pronunciations['uk'] || null;
            var _usData = this.pronunciations['us'] || null;
            var _comment = this.data['definition'];
            this.$text.innerHTML = this.text.substr(0, 1).toUpperCase() + this.text.substr(1);
            if (_ukData) this.$uk.innerHTML = '<span>英 [' + _ukData + ']</span><i class="btn-audio-play" data-audio-src="' + this.data['audio_addresses']['uk'][0] + '"></i>';
            if (_usData) this.$us.innerHTML = '<span>美 [' + _usData + ']</span><i class="btn-audio-play" data-audio-src="' + this.data['audio_addresses']['us'][0] + '"></i>';
            if (_comment) this.$comment.innerHTML = this.data['definition'];
            this.show();
        },
        //发送请求
        sendRequest: function () {
            var self = this;
            var now = +new Date();
            var xhr = new XMLHttpRequest();
            var url = 'https://api.shanbay.com/bdc/search/?' + 'word=' + this.text;
            xhr.open('GET', url, true);
            xhr.addEventListener('readyStateChange'.toLowerCase(), function () {
                if (this.readyState === 4) {
                    if ((this.status >= 200 && this.status < 300) || this.status == 304) {
                        if (this.responseText) {
                            self.response = JSON.parse(this.responseText);
                            self.isLoading = false;
                            //当最后一次发送的请求返回且状态码正确才继续执行下一步渲染
                            self.requestId === this.requestId
                            && self.response['status_code'] == 0
                            && self.render();
                        }
                    }
                }
            });
            xhr.send(null);
            //设置本次request id
            xhr.requestId = now;
            //存储最后一次request id
            this.requestId = now;
            this.isLoading = true;
        },
        //绑定事件
        bindEvents: function () {
            var self = this;
            $BODY.addEventListener('mouseup', function (e) {
                utils.debounce(function () {
                    //获取已选中的内容
                    var text = getSelectionText.call(self);
                    //当选中的内容不为空且内容中不包含空格
                    //一般默认包含空格的内容为语句,不包含空格的内容为单词
                    self.isStickerShow && self.hide();
                    if (text && isWord(text)) {
                        self.text = text;
                        self.eventMouseUp = e;
                        self.sendRequest();
                    }
                });
            });
            //窗口滚动事件
            window.addEventListener('scroll', function () {
                utils.debounce(function () {
                    if (self.isStickerShow) {
                        self.setStickerPosition();
                    }
                }, 60);
            });
            //窗口缩放事件
            window.addEventListener('resize', function () {
                utils.debounce(function () {
                    if (self.isStickerShow) {
                        getSelectionText.call(self);
                        self.setStickerPosition();
                    }
                }, 120);
            });
            //绑定语音事件
            [this.$uk, this.$us].forEach(function (dom) {
                dom.addEventListener('click', function () {
                    var src = dom.querySelectorAll('.btn-audio-play')[0].getAttribute('data-audio-src');
                    self.createAudio(src);
                }, false);
            });
            //sticker事件阻止冒泡
            this.$sticker.addEventListener('mouseup', function (e) {
                e.stopPropagation();
            });
            //绑定关闭事件
            this.$btnClose.addEventListener('click', function (e) {
                e.stopPropagation();
                self.hide();
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
    new TranslationSticker();

}());