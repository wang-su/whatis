/**
 * @author: wangsu
 * 本文件是一个windows下的可执行脚本, 用于转换doc, docx到纯txt, 便于做为语料进行分析.
 * 也可调整saveAs2方法用于转为为其它格式(html,pdf等).
 * 依赖cscript环境及office2013(仅在office2013下进行测试,其它版本执行状态未知.)
 * 速度较慢, 虚似机环境下约每秒一个, 为防止office卡死, 做了一个sleep(500)的延迟. 机器好的可进行调整.
 */
var currentDir = WScript.ScriptFullName.replace('doc2docx.js', '');
var source = currentDir + 'data';
var out = currentDir + 'out';

WScript.echo('start at..');

WScript.echo('source dir:' + source);
WScript.echo('output dir:' + out);

var fso = WScript.createObject("Scripting.FileSystemObject");
var word = WScript.createObject('Word.Application');

fileList = (function() {
    var result = [];
    var dir = fso.GetFolder(source);
    var files = dir.files;

    WScript.echo(files.Count);

    var fc = new Enumerator(files);
    var fname, baseName;
    var reg = /\.docx?$/i;

    for (; !fc.atEnd(); fc.moveNext()) {

        fname = "" + fc.item();
        baseName = fname.split("\\").pop();

        if (reg.test(fname)) {
            // WScript.echo();
            doc2txt(baseName);
            WScript.sleep(500);
        } else {
            WScript.echo('ignore: ' + fname);
        }
    }

    return result;
})();

function doc2txt(baseName) {

    var doc;
    WScript.echo('[start] convert: ' + source + "\\" + baseName, false, true);

    try {

        doc = word.Documents.Open(source + "\\" + baseName);
        // doc.Convert();
        doc.saveAs2(out + "\\" + baseName.replace(/\.docx?$/, '') + '.txt', 5);
        doc.Close();
        WScript.echo('[ok] convert:' + baseName);

    } catch (e) {

        WScript.echo("[Fail]: " + baseName + "\n" + (e.stack || e.message || e.toString()));
        
        try {
            word.Documents.Close();
        } catch (e) {
            WScript.echo("[Fatal]: " + baseName + "\n" + (e.stack || e.message || e.toString()));
        }
    }
}

