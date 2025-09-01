"use strict";
/**
 * Utility functions to handle character encoding issues in the database
 * The database stores characters with UTF-8 encoding that appears corrupted when displayed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TURNO_DB_TO_UI = exports.TURNO_UI_TO_DB = exports.FUNCAO_DB_TO_UI = exports.FUNCAO_UI_TO_DB = exports.TURNOS_UI_FORMAT = exports.TURNOS_DB_FORMAT = exports.FUNCOES_UI_FORMAT = exports.FUNCOES_DB_FORMAT = void 0;
exports.convertToDbFormat = convertToDbFormat;
exports.convertFromDbFormat = convertFromDbFormat;
/**
 * Converts special characters to database-stored format
 * This is needed because the database has encoding issues where:
 * - é becomes Ã©
 * - ã becomes Ã£
 * - ç becomes Ã§
 */
function convertToDbFormat(text) {
    return text
        .replace(/é/g, 'Ã©')
        .replace(/ã/g, 'Ã£')
        .replace(/ç/g, 'Ã§')
        .replace(/á/g, 'Ã¡')
        .replace(/à/g, 'Ã ')
        .replace(/ô/g, 'Ã´')
        .replace(/õ/g, 'Ãµ')
        .replace(/í/g, 'Ã­')
        .replace(/ú/g, 'Ãº');
}
/**
 * Converts database format back to readable format
 * This is the reverse of convertToDbFormat
 */
function convertFromDbFormat(text) {
    return text
        .replace(/Ã©/g, 'é')
        .replace(/Ã£/g, 'ã')
        .replace(/Ã§/g, 'ç')
        .replace(/Ã¡/g, 'á')
        .replace(/Ã /g, 'à')
        .replace(/Ã´/g, 'ô')
        .replace(/Ãµ/g, 'õ')
        .replace(/Ã­/g, 'í')
        .replace(/Ãº/g, 'ú');
}
/**
 * Standard functions list with correct encoding for database storage
 */
exports.FUNCOES_DB_FORMAT = [
    'Ajudante de ArmazÃ©m',
    'Operador de Empilhadeira',
    'Conferente',
    'Supervisor',
    'Gerente'
];
/**
 * Standard functions list in readable format for UI
 */
exports.FUNCOES_UI_FORMAT = [
    'Ajudante de Armazém',
    'Operador de Empilhadeira',
    'Conferente',
    'Supervisor',
    'Gerente'
];
/**
 * Standard shifts list with correct encoding for database storage
 */
exports.TURNOS_DB_FORMAT = [
    'Manha',
    'Tarde',
    'Noite',
    'Geral'
];
/**
 * Standard shifts list in readable format for UI
 */
exports.TURNOS_UI_FORMAT = [
    'Manhã',
    'Tarde',
    'Noite',
    'Geral'
];
/**
 * Mapping from UI format to DB format for functions
 */
exports.FUNCAO_UI_TO_DB = {
    'Ajudante de Armazém': 'Ajudante de ArmazÃ©m',
    'Operador de Empilhadeira': 'Operador de Empilhadeira',
    'Conferente': 'Conferente',
    'Supervisor': 'Supervisor',
    'Gerente': 'Gerente'
};
/**
 * Mapping from DB format to UI format for functions
 */
exports.FUNCAO_DB_TO_UI = {
    'Ajudante de ArmazÃ©m': 'Ajudante de Armazém',
    'Operador de Empilhadeira': 'Operador de Empilhadeira',
    'Conferente': 'Conferente',
    'Supervisor': 'Supervisor',
    'Gerente': 'Gerente'
};
/**
 * Mapping from UI format to DB format for shifts
 */
exports.TURNO_UI_TO_DB = {
    'Manhã': 'Manha',
    'Tarde': 'Tarde',
    'Noite': 'Noite',
    'Geral': 'Geral'
};
/**
 * Mapping from DB format to UI format for shifts
 */
exports.TURNO_DB_TO_UI = {
    'Manha': 'Manhã',
    'Tarde': 'Tarde',
    'Noite': 'Noite',
    'Geral': 'Geral'
};
