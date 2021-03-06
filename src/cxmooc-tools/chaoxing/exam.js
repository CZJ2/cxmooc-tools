const util = require('./util');
const common = require('../common');
const moocServer = require('../../config');

module.exports = {
    notic: undefined,
    getTopic: function () {
        let topic = $('.Cy_TItle.clearfix .clearfix');
        if (topic.length <= 0) {
            this.notic.text('未搜索到题目');
            return undefined;
        }
        let text = common.removeHTML($(topic).html());
        text = text.substr(0, text.lastIndexOf('分)'));
        text = text.substr(0, text.lastIndexOf('('));
        return text;
    },
    exam: function () {
        //生成按钮
        let self = this;
        let btn = util.createBtn('搜索答案', '搜索题目答案');
        $('.Cy_ulBottom.clearfix.w-buttom,.Cy_ulTk,.Cy_ulBottom.clearfix').after(btn);
        btn.onclick = function () {
            //搜索答案
            self.notic = util.signleLine('搜索答案中...', 'answer', btn.parentElement);
            let topic = self.getTopic();
            if (topic == undefined) {
                return false;
            }
            common.gm_post(moocServer.url + 'v2/answer', 'topic[0]=' + topic, false, function (data) {
                let json = JSON.parse(data);
                if (json[0].result.length <= 0) {
                    return self.notic.text('未找到答案');
                }
                let answer = json[0].result[Math.floor(Math.random() * Math.floor(json[0].result.length))];
                //填充
                self.fillAnswer(answer);
            }).error(function () {
                self.notic.text('网络错误');
            });
            return false;
        }
        if (config.auto) {
            btn.onclick();
        }
    },
    fillAnswer: function (answer) {
        let correct = answer.correct;
        switch (answer.type) {
            case 1:
            case 2: {
                let options = $('.Cy_ulBottom.clearfix.w-buttom li input');
                if (options.length <= 0) {
                    this.notic.text('答案搜索错误');
                    return false;
                }
                let noticText = '';
                $(options).removeAttr('checked');
                for (let i = 0; i < correct.length; i++) {
                    let index = (correct[i].option.charCodeAt() | 32) - 97;
                    // $(options[index]).attr('checked', true);
                    $(options[index]).click();
                    noticText += correct[i].option + ':' + correct[i].content + '<br/>';
                }
                $(this.notic).html(noticText);
                break;
            }
            case 3: {
                let options = $('.Cy_ulBottom.clearfix li input');
                if (options.length <= 0) {
                    this.notic.text('答案搜索错误');
                    return false;
                }
                $(options).removeAttr('checked');
                let index = 1;
                if (correct[0].option) {
                    index = 0;
                }
                // $(options[index]).attr('checked', true);
                $(options[index]).click();
                $(this.notic).html('答案:' + correct[0].option);
                break;
            }
            case 4: {
                let options = $('.Cy_ulTk .XztiHover1');
                if (options.length <= 0) {
                    this.notic.text('答案搜索错误');
                    return false;
                }
                let notic = '';
                for (let i = 0; i < options.length; i++) {
                    let pos = common.substrEx($(options[i]).find('.fb.font14').text(), '第', '空');
                    for (let n = 0; n < correct.length; n++) {
                        if (correct[n].option == pos) {
                            notic += ' 第' + pos + '空:' + correct[n].content + '<br/>';
                            var uedit = $(options[n]).find('textarea');
                            if (uedit.length <= 0) {
                                this.notic.text('答案搜索错误');
                                return false;
                            }
                            UE.getEditor(uedit.attr('name')).setContent(correct[n].content);
                            break;
                        }
                    }
                }
                $(this.notic).html(notic);
                break;
            }
            default: {
                this.notic.text('不支持的答案类型:' + JSON.stringify(correct));
                return false;
            }
        }
        return true;
    },
    collect: function () {
        let timu = $('.TiMu');
        let answer = [];
        for (let i = 0; i < timu.length; i++) {
            let topic = $(timu[i]).find('.Cy_TItle.clearfix .clearfix');
            if (topic.length <= 0) {
                continue;
            }
            let correct = $(timu[i]).find('.Py_answer.clearfix,.Py_tk');
            if ($(correct).text().indexOf('正确答案') >= 0 ||
                $(correct).find('dui').length > 0) {
                correct = common.removeHTML($(correct).html());
            } else {
                continue;
            }
            let topicText = common.removeHTML(topic.html());
            topicText = topicText.substr(0, topicText.lastIndexOf('('));
            let options = $(timu[i]).find('.Cy_ulTop li');
            let pushOption = { topic: topicText, answer: [], correct: [] };
            if (options.length <= 0) {
                //非选择
                let is = false;
                if ((is = correct.indexOf('√')) > 0 || correct.indexOf('×') > 0) {
                    if (is > 0) {
                        pushOption.correct.push({ option: true, content: true });
                    } else {
                        pushOption.correct.push({ option: false, content: false });
                    }
                    pushOption.type = 3
                } else {
                    let options = $(timu[i]).find('.font14.clearfix');
                    for (let n = 0; n < options.length; n++) {
                        let option = $(options[n]).find('.fb.fl').text();
                        if (option == null) {
                            break;
                        }
                        option = common.substrEx(option, '第', '空');
                        let content = $(options[n]).find('div.fl').html();
                        pushOption.correct.push({ option: option, content: common.removeHTML(content) });
                    }
                    pushOption.type = 4;
                }
            } else {
                let correctText = correct.match(/\w+/);
                if (correctText == null) {
                    continue;
                }
                correctText = correctText[0];
                for (let n = 0; n < options.length; n++) {
                    let option = $(options[n]).find('.fl').text().replace('、', '');
                    let tmp = {
                        option: $(options[n]).find('.fl').text().replace('、', ''),
                        content: common.removeHTML($(options[n]).find('.clearfix').html())
                    };
                    if (correctText.indexOf(option) >= 0) {
                        pushOption.correct.push(tmp);
                    }
                    pushOption.answer.push(tmp);
                }
                pushOption.type = correctText.length <= 1 ? 1 : 2;
            }
            answer.push(pushOption);
        }
        let box = util.pop_prompt("√  答案自动记录成功");
        $(document.body).append(box);
        setTimeout(function () { box.style.opacity = "1"; }, 500);
        common.gm_post(moocServer.url + 'answer', JSON.stringify(answer), true);
    }
};