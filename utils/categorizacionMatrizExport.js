/**
 * Matriz de categorización — exportación Excel / PDF
 * Formato alineado a la guía MinTransporte (documento tipo "MATRIZ CATEGORIZACION").
 */

const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const WEIGHTS = {
    funcionalidad: { A: 40, B: 25, C: 10 },
    tpd: { A: 20, B: 10, C: 5 },
    disenoGeometrico: { A: 20, B: 10, C: 5 },
    poblacion: { A: 20, B: 10, C: 5 }
};

/** Textos de opciones (misma lógica que el formulario InfraVial) */
const OPCIONES = {
    funcionalidad: [
        {
            valor: 'A',
            etiqueta: 'Primaria (1er Orden)',
            descripcion:
                'Conecta capitales de departamento, grandes centros económicos o hace parte de corredores nacionales / internacionales. Tráfico de largo recorrido.'
        },
        {
            valor: 'B',
            etiqueta: 'Secundaria (2do Orden)',
            descripcion:
                'Conecta municipios entre sí o con la capital del departamento. Sirve de acceso a cabeceras municipales importantes. Tráfico regional.'
        },
        {
            valor: 'C',
            etiqueta: 'Terciaria (3er Orden)',
            descripcion:
                'Conecta veredas, inspecciones de policía o zonas de producción agrícola con la cabecera municipal o con vías de orden superior. Tráfico local.'
        }
    ],
    tpd: [
        {
            valor: 'A',
            etiqueta: '> 5 000 vehículos / día',
            descripcion:
                'Tráfico Promedio Diario (TPD) superior a 5 000 vehículos. Flujo alto.'
        },
        {
            valor: 'B',
            etiqueta: '500 – 5 000 vehículos / día',
            descripcion: 'TPD entre 500 y 5 000 vehículos. Flujo intermedio.'
        },
        {
            valor: 'C',
            etiqueta: '< 500 vehículos / día',
            descripcion: 'TPD inferior a 500 vehículos. Flujo bajo.'
        }
    ],
    disenoGeometrico: [
        {
            valor: 'A',
            etiqueta: 'Estándar alto (80 km/h o más)',
            descripcion:
                'Calzada pavimentada con 2 o más carriles, curvas de gran radio, velocidad de diseño de 80 km/h o más. Buenas distancias de visibilidad.'
        },
        {
            valor: 'B',
            etiqueta: 'Estándar intermedio (40 – 80 km/h)',
            descripcion:
                'Calzada pavimentada, condiciones de diseño intermedias, velocidad de diseño entre 40 y 80 km/h.'
        },
        {
            valor: 'C',
            etiqueta: 'Estándar básico (< 40 km/h)',
            descripcion:
                'Vía sin pavimentar o con diseño geométrico básico, velocidad de diseño inferior a 40 km/h.'
        }
    ],
    poblacion: [
        {
            valor: 'A',
            etiqueta: '> 500 000 habitantes',
            descripcion:
                'La vía sirve a municipios o regiones con más de 500 000 habitantes.'
        },
        {
            valor: 'B',
            etiqueta: '25 000 – 500 000 habitantes',
            descripcion:
                'La vía sirve a municipios con población entre 25 000 y 500 000 habitantes.'
        },
        {
            valor: 'C',
            etiqueta: '< 25 000 habitantes',
            descripcion:
                'La vía sirve a municipios o centros con menos de 25 000 habitantes.'
        }
    ]
};

const CRITERIO_LABELS = {
    funcionalidad: ['PARTE 1. FUNCIONALIDAD', 40],
    tpd: ['PARTE 2. TRÁNSITO PROMEDIO DIARIO (TPD)', 20],
    disenoGeometrico: ['PARTE 3. DISEÑO GEOMÉTRICO', 20],
    poblacion: ['PARTE 4. POBLACIÓN SERVIDA', 20]
};

/** Mismo texto que el formulario web (matriz MinTransporte) */
const MATRIZ_PARTE1_INTRO =
    'A continuación deberá marcar según el conocimiento de la vía con una X según corresponda (ver numeral 5.1 de la guía para realizar la Categorización de la Red Vial Nacional). A continuación, se realizan una serie de preguntas con el fin de clasificar la vía.';

const MATRIZ_PARTE1_CONTEXTO =
    'El primer paso para categorizar una vía, es conocer muy bien cuál es la vía que se va a categorizar y verificar si la misma está o no incluida en la Red a cargo de la nación (Consultar la Resolución 339 del INVIAS año 1999 y Decreto 1735 del MT año 2001) lo cual permitirá determinar si forma parte de una troncal o transversal, igualmente se debe verificar si forma parte de la red del Plan Vial Regional de algún departamento. (Ver numeral 3 de la guía para realizar la Categorización de la Red Vial Nacional). Para conexiones entre capitales de departamento con veredas o poblaciones menores, se debe tomar la población menor.';

const MATRIZ_PARTE1_ITEMS = [
    'Calzada sencilla menor o igual a 6,00 m',
    'Calzada sencilla entre 6,01 m y 7,29 m',
    'Calzada sencilla mayor o igual a 7,30 m',
    'Doble calzada',
    'a) ¿Es una vía Troncal o Transversal? (Consultar la Resolución 339 del INVIAS año 1999 y Decreto 1735 del MT año 2001 o los que los modifiquen).',
    'b) El tramo a categorizar forma parte de una vía que conecta dos capitales de departamento.',
    'c) Conecta un paso fronterizo principal (establecido formalmente como tal) con una ciudad capital o una zona de producción o de consumo (*).',
    'd) ¿Conecta una ciudad principal con una zona de producción o de consumo (*) o con algún puerto marítimo o puerto fluvial que genere trasbordo intermodal? (*) De acuerdo con lo definido en el artículo 12 de la Ley 105 de 1993.',
    'e) La vía conecta: 1) Una capital de departamento con una cabecera municipal o 2) Dos o más municipios entre sí o se encuentra incluida dentro de las vías clasificadas en el plan vial regional del departamento. (Consultar el plan vial regional del departamento).',
    'f) La vía realiza interconexión únicamente a nivel veredal o entre la vereda y la capital de departamento o la vereda y una cabecera municipal o la vereda y una vía de primer o segundo orden.'
];

const MATRIZ_PARTE3_INTRO =
    'A continuación, usted deberá clasificar por medio de una X, la geometría de la vía (ver numerales 3,2 y 5,3 de la guía para categorización de la Red Vial Nacional).';

const MATRIZ_PARTE3_NOTA =
    'En InfraVial, tras valorar el tramo según esa guía, registre abajo una sola opción (A, B o C) que consolide el resultado del criterio de diseño geométrico para efectos de ponderación (20 pts máx.).';

const DOC_FIELD = {
    funcionalidad: 'funcionalidad',
    tpd: 'tpd',
    disenoGeometrico: 'disenoGeometrico',
    poblacion: 'poblacion'
};

function fmtFechaDDMMYYYY(d) {
    if (d == null || d === '') return '—';
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return '—';
    const dd = String(x.getDate()).padStart(2, '0');
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    const yyyy = x.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

function coordStr(lat, lng) {
    if (lat == null || lng == null) return '—';
    return `${lat}, ${lng}`;
}

function marksForSelection(selectedLetter, optionLetter) {
    const cols = ['', '', ''];
    const idx = { A: 0, B: 1, C: 2 }[selectedLetter];
    const oidx = { A: 0, B: 1, C: 2 }[optionLetter];
    if (idx === oidx) cols[idx] = 'X';
    return cols;
}

function filaPuntosCriterio(criterioKey, letter) {
    const w = WEIGHTS[criterioKey];
    if (letter === 'A') return [w.A, 0, 0];
    if (letter === 'B') return [0, w.B, 0];
    if (letter === 'C') return [0, 0, w.C];
    return [0, 0, 0];
}

function clasifEtiqueta(c) {
    if (c === 'PRIMARIA') return 'VÍA DE PRIMER ORDEN';
    if (c === 'SECUNDARIA') return 'VÍA DE SEGUNDO ORDEN';
    if (c === 'TERCIARIA') return 'VÍA DE TERCER ORDEN';
    return String(c || '—');
}

function safeFilenamePart(s) {
    if (!s || typeof s !== 'string') return 'categorizacion';
    return s
        .replace(/[^\w\-+.áéíóúñÁÉÍÓÚÑüÜ ]/g, '')
        .trim()
        .slice(0, 60)
        .replace(/\s+/g, '_');
}

/** @param {object} doc Mongoose lean plain object */
function buildSheetMatrix(doc) {
    const rows = [];

    rows.push([
        'MATRIZ DE CRITERIOS DE CATEGORIZACIÓN DE LA RED VIAL NACIONAL'
    ]);
    rows.push([
        'Documento para reporte — criterios registrados en sistema InfraVial (referencia guía Min. Transporte, Ley 1228/2008).'
    ]);
    rows.push([
        'Marca «X»: la casilla bajo el orden vial corresponde a la opción seleccionada (A=1er orden, B=2.do orden, C=3.er orden en cada criterio).'
    ]);
    rows.push([]);

    rows.push(['NOMBRE DE LA VÍA', doc.nombreVia || '']);
    rows.push(['FECHA DE CLASIFICACIÓN (DD/MM/AAAA)', fmtFechaDDMMYYYY(doc.fechaClasificacion)]);
    rows.push(['DEPARTAMENTO DONDE SE LOCALIZA LA VÍA', doc.departamento || '']);
    rows.push(['MUNICIPIO', doc.municipio || '']);
    rows.push(['CÓD. DEPARTAMENTO (DIVIPOL)', doc.deptoDivipol || '—']);
    rows.push(['CÓD. MUNICIPIO (DIVIPOL)', doc.munDivipol || '—']);
    rows.push(['NOMBRE DEL FUNCIONARIO', doc.nombreFuncionario || '—']);
    rows.push(['ENTIDAD', doc.entidadFuncionario || '—']);
    rows.push(['CÓDIGO PR', doc.codigoPR || '—']);
    rows.push(['LONGITUD DEL TRAMO — EJE VIAL (km)', doc.longitud_km ?? '—']);
    rows.push(['ANCHO DE CALZADA (m)', doc.ancho_m ?? '—']);
    rows.push(['LONGITUD GEODÉSICA INICIO–FIN (m)', doc.longitud_tramo_m ?? '—']);
    rows.push(['COORDENADA INICIO (lat, lng)', coordStr(doc.lat_inicio, doc.lng_inicio)]);
    rows.push(['COORDENADA FIN (lat, lng)', coordStr(doc.lat_fin, doc.lng_fin)]);
    rows.push(['VALOR TPD DECLARADO (veh/día)', doc.tpdValor ?? '—']);
    rows.push(['VALOR POBLACIÓN DECLARADA', doc.poblacionValor ?? '—']);
    rows.push(['OBSERVACIONES', doc.observaciones || '—']);
    rows.push([]);

    const hdr = [
        'DESCRIPCIÓN DE LA OPCIÓN (marque una por criterio)',
        'VÍA DE PRIMER ORDEN',
        'VÍA DE SEGUNDO ORDEN',
        'VÍA DE TERCER ORDEN',
        'SI / NO / CORRECCIONES / OBSERVACIONES (campo libre)'
    ];

    for (const key of Object.keys(CRITERIO_LABELS)) {
        const [parte, peso] = CRITERIO_LABELS[key];
        if (key === 'funcionalidad') {
            rows.push(['REFERENCIA — PARTE 1 (texto guía MinTransporte)']);
            rows.push([MATRIZ_PARTE1_INTRO]);
            rows.push([MATRIZ_PARTE1_CONTEXTO]);
            rows.push(['Ítems de la matriz (marcar en documento impreso con X por orden vial):']);
            MATRIZ_PARTE1_ITEMS.forEach((linea, idx) => {
                rows.push([`${idx + 1}. ${linea}`, '', '', '', '']);
            });
            rows.push([]);
            rows.push([
                'Selección registrada en sistema (consolidado Parte 1 — una opción A, B o C):'
            ]);
            rows.push([]);
        }
        if (key === 'disenoGeometrico') {
            rows.push(['REFERENCIA — PARTE 3 (texto guía MinTransporte)']);
            rows.push([MATRIZ_PARTE3_INTRO]);
            rows.push([MATRIZ_PARTE3_NOTA]);
            rows.push([]);
            rows.push([
                'Selección registrada en sistema (consolidado Parte 3 — una opción A, B o C):'
            ]);
            rows.push([]);
        }
        rows.push([`${parte} — Ponderación máxima: ${peso} puntos`]);
        rows.push(hdr);
        const field = DOC_FIELD[key];
        const selected = doc[field];
        for (const op of OPCIONES[key]) {
            const mark = marksForSelection(selected, op.valor);
            rows.push([
                `${op.valor}) ${op.etiqueta} — ${op.descripcion}`,
                mark[0],
                mark[1],
                mark[2],
                ''
            ]);
        }
        rows.push([]);
    }

    rows.push(['MATRIZ DE RESULTADOS DE CATEGORIZACIÓN']);
    rows.push([]);
    rows.push([
        'CRITERIO (puntos aportados al orden indicado)',
        'VÍA DE PRIMER ORDEN',
        'VÍA DE SEGUNDO ORDEN',
        'VÍA DE TERCER ORDEN'
    ]);

    const fPts = filaPuntosCriterio('funcionalidad', doc.funcionalidad);
    const tPts = filaPuntosCriterio('tpd', doc.tpd);
    const dPts = filaPuntosCriterio('disenoGeometrico', doc.disenoGeometrico);
    const pPts = filaPuntosCriterio('poblacion', doc.poblacion);

    rows.push(['FUNCIONALIDAD (40 / 25 / 10)', ...fPts]);
    rows.push(['TRÁNSITO PROMEDIO DIARIO (20 / 10 / 5)', ...tPts]);
    rows.push(['DISEÑO GEOMÉTRICO (20 / 10 / 5)', ...dPts]);
    rows.push(['POBLACIÓN (20 / 10 / 5)', ...pPts]);
    rows.push([
        'SUMA DE PUNTAJES',
        doc.ptsPrimerOrden ?? 0,
        doc.ptsSegundoOrden ?? 0,
        doc.ptsTercerOrden ?? 0
    ]);
    rows.push([]);
    rows.push(['CLASIFICACIÓN FINAL (resultado ponderado)', clasifEtiqueta(doc.clasificacion)]);
    rows.push(['Categoría técnica', doc.clasificacion || '—']);

    return rows;
}

function generarMatrizXlsxBuffer(doc) {
    const data = buildSheetMatrix(doc);
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
        { wch: 72 },
        { wch: 22 },
        { wch: 22 },
        { wch: 22 },
        { wch: 36 }
    ];
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Matriz categorización');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function generarMatrizPdfBuffer(doc) {
    return new Promise((resolve, reject) => {
        const docPdf = new PDFDocument({
            size: 'LETTER',
            margins: { top: 44, bottom: 44, left: 48, right: 48 },
            info: {
                Title: 'Matriz categorización red vial',
                Author: 'InfraVial'
            }
        });
        const chunks = [];
        docPdf.on('data', (c) => chunks.push(c));
        docPdf.on('end', () => resolve(Buffer.concat(chunks)));
        docPdf.on('error', reject);

        const pageWidth =
            docPdf.page.width - docPdf.page.margins.left - docPdf.page.margins.right;

        function titulo(text) {
            docPdf.font('Helvetica-Bold').fontSize(11).text(text, {
                align: 'center',
                width: pageWidth
            });
            docPdf.moveDown(0.5);
            docPdf.font('Helvetica').fontSize(8.5);
        }

        function parrafo(text) {
            docPdf.font('Helvetica').fontSize(8.5).text(text, {
                align: 'justify',
                width: pageWidth
            });
            docPdf.moveDown(0.4);
        }

        function lineaCampo(etiqueta, valor) {
            docPdf
                .font('Helvetica-Bold')
                .fontSize(8.5)
                .text(`${etiqueta}: `, { continued: true })
                .font('Helvetica')
                .text(String(valor ?? '—'), { width: pageWidth });
            docPdf.moveDown(0.25);
        }

        titulo(
            'MATRIZ DE CRITERIOS DE CATEGORIZACIÓN DE LA RED VIAL NACIONAL'
        );
        parrafo(
            'Documento para reporte — criterios registrados en InfraVial (referencia guía Min. Transporte, Ley 1228/2008). Marque «X» en la columna del orden vial correspondiente a cada opción elegida.'
        );
        docPdf.moveDown(0.3);

        lineaCampo('NOMBRE DE LA VÍA', doc.nombreVia);
        lineaCampo('FECHA DE CLASIFICACIÓN (DD/MM/AAAA)', fmtFechaDDMMYYYY(doc.fechaClasificacion));
        lineaCampo('DEPARTAMENTO', doc.departamento);
        lineaCampo('MUNICIPIO', doc.municipio);
        lineaCampo('NOMBRE DEL FUNCIONARIO', doc.nombreFuncionario);
        lineaCampo('ENTIDAD', doc.entidadFuncionario);
        lineaCampo('CÓDIGO PR', doc.codigoPR);
        lineaCampo('LONGITUD TRAMO EJE VIAL (km)', doc.longitud_km);
        lineaCampo('ANCHO CALZADA (m)', doc.ancho_m);
        lineaCampo('LONGITUD GEODÉSICA (m)', doc.longitud_tramo_m);
        lineaCampo('COORD. INICIO', coordStr(doc.lat_inicio, doc.lng_inicio));
        lineaCampo('COORD. FIN', coordStr(doc.lat_fin, doc.lng_fin));
        lineaCampo('OBSERVACIONES', doc.observaciones || '—');

        docPdf.moveDown(0.5);

        const colW = [pageWidth * 0.52, pageWidth * 0.13, pageWidth * 0.13, pageWidth * 0.13];
        const hdrLabels = [
            'Opción',
            '1.er orden',
            '2.do orden',
            '3.er orden'
        ];

        function bloqueReferenciaParte1() {
            if (docPdf.y > docPdf.page.height - 200) docPdf.addPage();
            docPdf.font('Helvetica-Bold').fontSize(8.5).text('REFERENCIA — Parte 1 (texto guía MinTransporte)', {
                width: pageWidth
            });
            docPdf.moveDown(0.25);
            parrafo(MATRIZ_PARTE1_INTRO);
            parrafo(MATRIZ_PARTE1_CONTEXTO);
            docPdf.font('Helvetica-Bold').fontSize(8);
            docPdf.text('Ítems de la matriz (en documento impreso, marque X por orden vial):', {
                width: pageWidth
            });
            docPdf.moveDown(0.2);
            MATRIZ_PARTE1_ITEMS.forEach((linea, idx) => {
                if (docPdf.y > docPdf.page.height - 48) docPdf.addPage();
                docPdf
                    .font('Helvetica')
                    .fontSize(7.8)
                    .text(`${idx + 1}. ${linea}`, { width: pageWidth, align: 'justify' });
                docPdf.moveDown(0.15);
            });
            docPdf.moveDown(0.2);
            docPdf
                .font('Helvetica-Bold')
                .fontSize(8)
                .text(
                    'Selección registrada en sistema (consolidado Parte 1 — una opción A, B o C):',
                    { width: pageWidth }
                );
            docPdf.moveDown(0.35);
        }

        function bloqueReferenciaParte3() {
            if (docPdf.y > docPdf.page.height - 120) docPdf.addPage();
            docPdf.font('Helvetica-Bold').fontSize(8.5).text('REFERENCIA — Parte 3 (texto guía MinTransporte)', {
                width: pageWidth
            });
            docPdf.moveDown(0.25);
            parrafo(MATRIZ_PARTE3_INTRO);
            parrafo(MATRIZ_PARTE3_NOTA);
            docPdf.font('Helvetica-Bold').fontSize(8);
            docPdf.text(
                'Selección registrada en sistema (consolidado Parte 3 — una opción A, B o C):',
                { width: pageWidth }
            );
            docPdf.moveDown(0.35);
        }

        function tablaCriterio(parteLabel, key) {
            if (docPdf.y > docPdf.page.height - 160) {
                docPdf.addPage();
            }
            docPdf.font('Helvetica-Bold').fontSize(9).text(parteLabel, { width: pageWidth });
            docPdf.moveDown(0.3);
            const field = DOC_FIELD[key];
            const selected = doc[field];
            let x0 = docPdf.page.margins.left;
            const yStart = docPdf.y;
            let y = yStart;
            docPdf.font('Helvetica-Bold').fontSize(7.5);
            hdrLabels.forEach((h, i) => {
                docPdf.text(h, x0, y, { width: colW[i], align: i === 0 ? 'left' : 'center' });
                x0 += colW[i];
            });
            y += 14;
            docPdf
                .moveTo(docPdf.page.margins.left, y - 2)
                .lineTo(docPdf.page.margins.left + pageWidth, y - 2)
                .stroke();

            const lineGapFilas = 1;
            const gapEtiquetaDescripcion = 3;
            const gapEntreFilas = 8;

            for (const op of OPCIONES[key]) {
                const txt = `${op.valor}) ${op.etiqueta}`;
                docPdf.font('Helvetica').fontSize(7.5);
                const hEtiqueta = docPdf.heightOfString(txt, {
                    width: colW[0],
                    lineGap: lineGapFilas
                });
                docPdf.font('Helvetica').fontSize(6.8);
                const hDesc = docPdf.heightOfString(op.descripcion, {
                    width: colW[0],
                    lineGap: lineGapFilas
                });
                const altoMarcas = 11;
                const bloqueAlto =
                    Math.max(hEtiqueta, altoMarcas) +
                    gapEtiquetaDescripcion +
                    hDesc +
                    gapEntreFilas;

                const yBottom = y + bloqueAlto;
                if (yBottom > docPdf.page.height - docPdf.page.margins.bottom) {
                    docPdf.addPage();
                    y = docPdf.page.margins.top;
                }

                x0 = docPdf.page.margins.left;
                const mark = marksForSelection(selected, op.valor);
                docPdf.font('Helvetica').fontSize(7.5).fillColor('#000000');
                docPdf.text(txt, x0, y, {
                    width: colW[0],
                    lineGap: lineGapFilas
                });
                x0 += colW[0];
                for (let i = 0; i < 3; i++) {
                    docPdf.font('Helvetica-Bold').fontSize(8).text(mark[i] || '', x0, y, {
                        width: colW[i + 1],
                        align: 'center'
                    });
                    x0 += colW[i + 1];
                }
                const yDesc = y + hEtiqueta + gapEtiquetaDescripcion;
                docPdf.font('Helvetica').fontSize(6.8).fillColor('#333333');
                docPdf.text(op.descripcion, docPdf.page.margins.left, yDesc, {
                    width: colW[0],
                    lineGap: lineGapFilas
                });
                docPdf.fillColor('#000000');
                y = yDesc + hDesc + gapEntreFilas;
            }
            docPdf.y = y + 8;
            docPdf.moveDown(0.5);
        }

        for (const key of Object.keys(CRITERIO_LABELS)) {
            const [parte, peso] = CRITERIO_LABELS[key];
            if (key === 'funcionalidad') bloqueReferenciaParte1();
            if (key === 'disenoGeometrico') bloqueReferenciaParte3();
            tablaCriterio(`${parte} — Ponderación máxima: ${peso} puntos`, key);
        }

        if (docPdf.y > docPdf.page.height - 140) docPdf.addPage();

        titulo('MATRIZ DE RESULTADOS DE CATEGORIZACIÓN');
        docPdf.font('Helvetica').fontSize(8.5);
        const resY0 = docPdf.y;
        let rx = docPdf.page.margins.left;
        const rw = pageWidth / 4;
        ['Criterio', '1.er orden', '2.do orden', '3.er orden'].forEach((h, i) => {
            docPdf.font('Helvetica-Bold').text(h, rx + i * rw, resY0, {
                width: rw,
                align: i === 0 ? 'left' : 'center'
            });
        });
        let ry = resY0 + 16;
        const resRows = [
            ['FUNCIONALIDAD', ...filaPuntosCriterio('funcionalidad', doc.funcionalidad)],
            ['TPD', ...filaPuntosCriterio('tpd', doc.tpd)],
            ['DISEÑO GEOMÉTRICO', ...filaPuntosCriterio('disenoGeometrico', doc.disenoGeometrico)],
            ['POBLACIÓN', ...filaPuntosCriterio('poblacion', doc.poblacion)],
            [
                'TOTAL',
                doc.ptsPrimerOrden ?? 0,
                doc.ptsSegundoOrden ?? 0,
                doc.ptsTercerOrden ?? 0
            ]
        ];
        for (const row of resRows) {
            rx = docPdf.page.margins.left;
            docPdf.font('Helvetica').fontSize(8.5);
            docPdf.text(String(row[0]), rx, ry, { width: rw });
            for (let j = 1; j <= 3; j++) {
                docPdf.text(String(row[j]), rx + j * rw, ry, {
                    width: rw,
                    align: 'center'
                });
            }
            ry += 16;
        }
        ry += 8;
        docPdf.font('Helvetica-Bold').fontSize(10).text(
            `CLASIFICACIÓN FINAL: ${clasifEtiqueta(doc.clasificacion)} (${doc.clasificacion || '—'})`,
            docPdf.page.margins.left,
            ry,
            { width: pageWidth }
        );

        docPdf.end();
    });
}

module.exports = {
    generarMatrizXlsxBuffer,
    generarMatrizPdfBuffer,
    safeFilenamePart,
    fmtFechaDDMMYYYY
};
