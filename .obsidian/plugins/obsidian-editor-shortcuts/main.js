/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/

'use strict';

var obsidian = require('obsidian');

const getLineStartPos = (line) => ({
    line,
    ch: 0,
});
const getLineEndPos = (line, editor) => ({
    line,
    ch: editor.getLine(line).length,
});
const getSelectionBoundaries = (selection) => {
    let { anchor: from, head: to } = selection;
    // in case user selects upwards
    if (from.line > to.line) {
        [from, to] = [to, from];
    }
    return { from, to };
};
const getLeadingWhitespace = (lineContent) => {
    const indentation = lineContent.match(/^\s+/);
    return indentation ? indentation[0] : '';
};
const isWordCharacter = (char) => /\w/.test(char);
const wordRangeAtPos = (pos, lineContent) => {
    let start = pos.ch;
    let end = pos.ch;
    while (start > 0 && isWordCharacter(lineContent.charAt(start - 1))) {
        start--;
    }
    while (end < lineContent.length && isWordCharacter(lineContent.charAt(end))) {
        end++;
    }
    return {
        anchor: {
            line: pos.line,
            ch: start,
        },
        head: {
            line: pos.line,
            ch: end,
        },
    };
};

var CASE;
(function (CASE) {
    CASE["UPPER"] = "upper";
    CASE["LOWER"] = "lower";
    CASE["TITLE"] = "title";
})(CASE || (CASE = {}));
const LOWERCASE_ARTICLES = ['the', 'a', 'an'];

const insertLineAbove = (editor) => {
    const { line } = editor.getCursor();
    const startOfCurrentLine = getLineStartPos(line);
    editor.replaceRange('\n', startOfCurrentLine);
    editor.setSelection(startOfCurrentLine);
};
const insertLineBelow = (editor) => {
    const { line } = editor.getCursor();
    const endOfCurrentLine = getLineEndPos(line, editor);
    const indentation = getLeadingWhitespace(editor.getLine(line));
    editor.replaceRange('\n' + indentation, endOfCurrentLine);
    editor.setSelection({ line: line + 1, ch: indentation.length });
};
const deleteSelectedLines = (editor) => {
    const selections = editor.listSelections();
    if (selections.length === 0) {
        return;
    }
    const { from, to } = getSelectionBoundaries(selections[0]);
    const startOfCurrentLine = getLineStartPos(from.line);
    const startOfNextLine = getLineStartPos(to.line + 1);
    editor.replaceRange('', startOfCurrentLine, startOfNextLine);
};
const joinLines = (editor) => {
    const { line } = editor.getCursor();
    const contentsOfNextLine = editor.getLine(line + 1).trimStart();
    const endOfCurrentLine = getLineEndPos(line, editor);
    const endOfNextLine = getLineEndPos(line + 1, editor);
    editor.replaceRange(contentsOfNextLine.length > 0
        ? ' ' + contentsOfNextLine
        : contentsOfNextLine, endOfCurrentLine, endOfNextLine);
    editor.setSelection(endOfCurrentLine);
};
const duplicateLine = (editor) => {
    const selections = editor.listSelections();
    if (selections.length === 0) {
        return;
    }
    const { from, to } = getSelectionBoundaries(selections[0]);
    const fromLineStart = getLineStartPos(from.line);
    const toLineEnd = getLineEndPos(to.line, editor);
    const contentsOfSelectedLines = editor.getRange(fromLineStart, toLineEnd);
    editor.replaceRange(contentsOfSelectedLines + '\n', fromLineStart);
};
const selectLine = (editor) => {
    const selections = editor.listSelections();
    if (selections.length === 0) {
        return;
    }
    const { from, to } = getSelectionBoundaries(selections[0]);
    const startOfCurrentLine = getLineStartPos(from.line);
    // if a line is already selected, expand the selection to the next line
    const startOfNextLine = getLineStartPos(to.line + 1);
    editor.setSelection(startOfCurrentLine, startOfNextLine);
};
const goToLineBoundary = (editor, boundary) => {
    const { line } = editor.getCursor('from');
    editor.setSelection(boundary === 'start' ? getLineStartPos(line) : getLineEndPos(line, editor));
};
const transformCase = (editor, caseType) => {
    const originalSelections = editor.listSelections();
    let selectedText = editor.getSelection();
    // apply transform on word at cursor if nothing is selected
    if (selectedText.length === 0) {
        const pos = editor.getCursor('from');
        const { anchor, head } = wordRangeAtPos(pos, editor.getLine(pos.line));
        editor.setSelection(anchor, head);
        selectedText = editor.getRange(anchor, head);
    }
    if (caseType === CASE.TITLE) {
        editor.replaceSelection(
        // use capture group to join with the same separator used to split
        selectedText
            .split(/(\s+)/)
            .map((word, index, allWords) => {
            if (index > 0 &&
                index < allWords.length - 1 &&
                LOWERCASE_ARTICLES.includes(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
        })
            .join(''));
    }
    else {
        editor.replaceSelection(caseType === CASE.UPPER
            ? selectedText.toUpperCase()
            : selectedText.toLowerCase());
    }
    // restore original selection after replacing content
    if (originalSelections.length > 0) {
        const { anchor, head } = originalSelections[0];
        editor.setSelection(anchor, head);
    }
};

class CodeEditorShortcuts extends obsidian.Plugin {
    onload() {
        this.addCommand({
            id: 'insertLineAbove',
            name: 'Insert line above',
            hotkeys: [
                {
                    modifiers: ['Mod', 'Shift'],
                    key: 'Enter',
                },
            ],
            editorCallback: (editor) => insertLineAbove(editor),
        });
        this.addCommand({
            id: 'insertLineBelow',
            name: 'Insert line below',
            hotkeys: [
                {
                    modifiers: ['Mod'],
                    key: 'Enter',
                },
            ],
            editorCallback: (editor) => insertLineBelow(editor),
        });
        this.addCommand({
            id: 'deleteLine',
            name: 'Delete line',
            hotkeys: [
                {
                    modifiers: ['Mod', 'Shift'],
                    key: 'K',
                },
            ],
            editorCallback: (editor) => deleteSelectedLines(editor),
        });
        this.addCommand({
            id: 'joinLines',
            name: 'Join lines',
            hotkeys: [
                {
                    modifiers: ['Mod'],
                    key: 'J',
                },
            ],
            editorCallback: (editor) => joinLines(editor),
        });
        this.addCommand({
            id: 'duplicateLine',
            name: 'Duplicate line',
            hotkeys: [
                {
                    modifiers: ['Mod', 'Shift'],
                    key: 'D',
                },
            ],
            editorCallback: (editor) => duplicateLine(editor),
        });
        this.addCommand({
            id: 'selectLine',
            name: 'Select line',
            hotkeys: [
                {
                    modifiers: ['Mod'],
                    key: 'L',
                },
            ],
            editorCallback: (editor) => selectLine(editor),
        });
        this.addCommand({
            id: 'goToLineStart',
            name: 'Go to start of line',
            editorCallback: (editor) => goToLineBoundary(editor, 'start'),
        });
        this.addCommand({
            id: 'goToLineEnd',
            name: 'Go to end of line',
            editorCallback: (editor) => goToLineBoundary(editor, 'end'),
        });
        this.addCommand({
            id: 'transformToUppercase',
            name: 'Transform selection to uppercase',
            editorCallback: (editor) => transformCase(editor, CASE.UPPER),
        });
        this.addCommand({
            id: 'transformToLowercase',
            name: 'Transform selection to lowercase',
            editorCallback: (editor) => transformCase(editor, CASE.LOWER),
        });
        this.addCommand({
            id: 'transformToTitlecase',
            name: 'Transform selection to title case',
            editorCallback: (editor) => transformCase(editor, CASE.TITLE),
        });
    }
}

module.exports = CodeEditorShortcuts;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsidXRpbHMudHMiLCJjb25zdGFudHMudHMiLCJhY3Rpb25zLnRzIiwibWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6bnVsbCwibmFtZXMiOlsiUGx1Z2luIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFTyxNQUFNLGVBQWUsR0FBRyxDQUFDLElBQVksTUFBc0I7SUFDaEUsSUFBSTtJQUNKLEVBQUUsRUFBRSxDQUFDO0NBQ04sQ0FBQyxDQUFDO0FBRUksTUFBTSxhQUFhLEdBQUcsQ0FDM0IsSUFBWSxFQUNaLE1BQWMsTUFDTTtJQUNwQixJQUFJO0lBQ0osRUFBRSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTTtDQUNoQyxDQUFDLENBQUM7QUFFSSxNQUFNLHNCQUFzQixHQUFHLENBQUMsU0FBMEI7SUFDL0QsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLFNBQVMsQ0FBQzs7SUFHM0MsSUFBSSxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUU7UUFDdkIsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDekI7SUFFRCxPQUFPLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO0FBQ3RCLENBQUMsQ0FBQztBQUVLLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxXQUFtQjtJQUN0RCxNQUFNLFdBQVcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLE9BQU8sV0FBVyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDM0MsQ0FBQyxDQUFDO0FBRUYsTUFBTSxlQUFlLEdBQUcsQ0FBQyxJQUFZLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUVuRCxNQUFNLGNBQWMsR0FBRyxD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
