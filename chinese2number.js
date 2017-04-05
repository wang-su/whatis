/**
 * @fileOverview chinese2number.js
 * 		转换中文数字到数字.
 */

let chineseNumber = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
let chinesePower = ["零", "十", "百", "千", "万", "十万", "百万", "千万", "亿", "十亿", "百亿", "千亿", "万亿", "十万亿", "百万亿", "千万亿"];


function chinese2number_single(str) {

    let v, p;

    v = chineseNumber.indexOf(str);
    p = chinesePower.indexOf(str);

    if (v == -1 && p == -1) {
        return Number.NaN;
    }

    return v !== -1 ? v : Math.pow(10, p);
}

/**
 * 2个长度的, 变化较多, 十x,或n百,n千等.
 * @param {string} str 待转换字符串
 * @return {number} 结果数字
 */
function chinese2number_len(str) {

    let charts = str.split('').map((n) => {
        return chinese2number_single(n);
    }).reverse();

    let len = charts.length,
        p = 1;

    return charts.reduce((current, value, index, arr) => {

        if (index == len - 1 && value >= 10) {
            return current + 1 * value * p;
        } else if (value >= 10) {
            p *= value;
            return current;
        } else {
            let op = p;
            p = 1;
            return current + value * op;
        }

    }, 0);
}


function chinese2Number(str) {
    let len = str.length;
    switch (len) {
        case 1:
            return chinese2number_single(str);
        case 2:
        default:
            return chinese2number_len(str);
    }
}

// test code.
console.log(chinese2Number("一千万零三百"))
console.log(chinese2Number("十"))
console.log(chinese2Number("百"))
console.log(chinese2Number("一亿五千万一千一百五十一"))
console.log(chinese2Number("五十五"))
console.log(chinese2Number("十五"))
