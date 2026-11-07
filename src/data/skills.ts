import type { Skill, SkillId } from '../types/index.ts'

// ==================== ИКОНКИ НАВЫКОВ ====================

export const skillIcons: Record<SkillId, string> = {
  accounting: '📊',
  hr: '👥',
  it: '💻',
  laborProt: '⛑️',
  marketing: '📈',
  repair: '🔧',
  security: '🛡️',
}

// ==================== МАССИВ СКИЛЛОВ ====================

export const skills: Skill[] = [
    // ==================== БУХГАЛТЕРИЯ ====================
    {
        id: 'accounting',
        name: 'Бухгалтерия',
        imagePath: 'accounting',
        description: 'Обеспечивает контроль финансовых потоков.',
        maxLevel: 10,
        levels: [
            // УРОВЕНЬ 1 — нейтральный
            {
                level: 1,
                cost: 1000,
                factor: 1.25,
                unlocksName: 'Финансовая отчётность',
                unlocksDescription: 'Помогает проводить анализ.',
                unlocksImage: 'accounting-1',
            },
            // УРОВЕНЬ 2 — нейтральный
            {
                level: 2,
                cost: 10000,
                factor: 1.35,
                unlocksName: 'Контроль расходов',
                unlocksDescription: 'Лишние траты отсекаются.',
                unlocksImage: 'accounting-2',
            },
            // УРОВЕНЬ 3 — ВЫБОР
            {
                level: 3,
                branch: [
                    {
                        path: 'legal',
                        cost: 50000,
                        factor: 1.4,
                        unlocksName: 'Официальный бухучёт',
                        unlocksDescription: 'Кристальная чистота в документах.',
                        unlocksImage: 'accountingLegal-1',
                    },
                    {
                        path: 'dark',
                        cost: 50000,
                        factor: 1.45,
                        unlocksName: 'Теневая касса',
                        unlocksDescription: 'Не всё золото любит свет.',
                        unlocksImage: 'accountingDark-1',
                    },
                ],
            },
            // УРОВЕНЬ 4 — нейтральный
            {
                level: 4,
                cost: 150000,
                factor: 1.5,
                unlocksName: 'Налоговый вычет',
                unlocksDescription: 'Государство вернёт часть ваших денег.',
                unlocksImage: 'accounting-3',
            },
            // УРОВЕНЬ 5 — ВЫБОР
            {
                level: 5,
                branch: [
                    {
                        path: 'legal',
                        cost: 350000,
                        factor: 1.6,
                        unlocksName: 'Инвестиционный портфель',
                        unlocksDescription: 'Централизация финансовых активов.',
                        unlocksImage: 'accountingLegal-2',
                    },
                    {
                        path: 'dark',
                        cost: 350000,
                        factor: 1.65,
                        unlocksName: 'Сомнительные инвестиции',
                        unlocksDescription: 'Вложения в то, о чём лучше молчать.',
                        unlocksImage: 'accountingDark-2',
                    },
                ],
            },
            // УРОВЕНЬ 6 — нейтральный
            {
                level: 6,
                cost: 500000,
                factor: 1.7,
                unlocksName: 'Аудит',
                unlocksDescription: 'Полная проверка всех операций.',
                unlocksImage: 'accounting-4',
            },
            // УРОВЕНЬ 7 — ВЫБОР
            {
                level: 7,
                branch: [
                    {
                        path: 'legal',
                        cost: 750000,
                        factor: 1.8,
                        unlocksName: 'Прозрачная отчётность',
                        unlocksDescription: 'Каждая транзакция легальна и видна.',
                        unlocksImage: 'accountingLegal-3',
                    },
                    {
                        path: 'dark',
                        cost: 750000,
                        factor: 1.85,
                        unlocksName: 'Двойная бухгалтерия',
                        unlocksDescription: 'Для налоговой одни цифры, для вас другие.',
                        unlocksImage: 'accountingDark-3',
                    },
                ],
            },
            // УРОВЕНЬ 8 — нейтральный (НОВЫЙ)
            {
                level: 8,
                cost: 1000000,
                factor: 1.9,
                unlocksName: 'Автоматизация учёта',
                unlocksDescription: 'ERP-система сводит все транзакции в единый поток. Без бумаги, без задержек.',
                unlocksImage: 'accounting-5',
            },
            // УРОВЕНЬ 9 — ВЫБОР
            {
                level: 9,
                branch: [
                    {
                        path: 'legal',
                        cost: 1500000,
                        factor: 2,
                        unlocksName: 'Легальный лоббизм',
                        unlocksDescription: 'Продвижение интересов через официальные каналы.',
                        unlocksImage: 'accountingLegal-4',
                    },
                    {
                        path: 'dark',
                        cost: 1500000,
                        factor: 2.1,
                        unlocksName: 'Теневой лоббизм',
                        unlocksDescription: 'Под вашу деятельность начинают писать законы.',
                        unlocksImage: 'accountingDark-4',
                    },
                ],
            },
            // УРОВЕНЬ 10 — ФИНАЛЬНЫЙ ВЫБОР
            {
                level: 10,
                branch: [
                    {
                        path: 'legal',
                        cost: 10000000,
                        factor: 2.5,
                        unlocksName: 'Честная конкуренция',
                        unlocksDescription: 'Вы выигрываете рынок, не нарушая ни одного закона. Империя, построенная на доверии.',
                        unlocksImage: 'accountingLegal-5',
                    },
                    {
                        path: 'dark',
                        cost: 10000000,
                        factor: 2.6,
                        unlocksName: 'Финансовый диктат',
                        unlocksDescription: 'Полный контроль рынка. Конкуренты разорены, регуляторы куплены, правила написаны вами.',
                        unlocksImage: 'accountingDark-5',
                    },
                ],
            },
        ],
    },

    // ==================== ОТДЕЛ КАДРОВ ====================
    {
        id: 'hr',
        name: 'Кадры',
        imagePath: 'hr',
        description: 'Обеспечивает подбор и работу с персоналом.',
        maxLevel: 10,
        levels: [
            // УРОВЕНЬ 1 — нейтральный
            {
                level: 1,
                cost: 1000,
                factor: 1.25,
                unlocksName: 'Рекрутинг',
                unlocksDescription: 'Работа с резюме. Отбор тех, кто умеет писать.',
                unlocksImage: 'hr-4',
            },
            // УРОВЕНЬ 2 — нейтральный
            {
                level: 2,
                cost: 10000,
                factor: 1.35,
                unlocksName: 'Адаптация',
                unlocksDescription: 'Помощь новеньким в первые месяцы работы.',
                unlocksImage: 'hr-1',
            },
            // УРОВЕНЬ 3 — ВЫБОР
            {
                level: 3,
                branch: [
                    {
                        path: 'liberal',
                        cost: 50000,
                        factor: 1.4,
                        unlocksName: 'Мягкая мотивация',
                        unlocksDescription: 'Небольшая премия хорошим сотрудникам.',
                        unlocksImage: 'hrLegal-1',
                    },
                    {
                        path: 'totalitarian',
                        cost: 50000,
                        factor: 1.45,
                        unlocksName: 'KPI и метрики',
                        unlocksDescription: 'С отстающими проводится воспитательная работа.',
                        unlocksImage: 'hrDark-2',
                    },
                ],
            },
            // УРОВЕНЬ 4 — нейтральный
            {
                level: 4,
                cost: 150000,
                factor: 1.5,
                unlocksName: 'Обучение',
                unlocksDescription: 'Помощь в развитии навыков рабочих.',
                unlocksImage: 'hr-3',
            },
            // УРОВЕНЬ 5 — ВЫБОР
            {
                level: 5,
                branch: [
                    {
                        path: 'liberal',
                        cost: 350000,
                        factor: 1.6,
                        unlocksName: 'Тимбилдинг',
                        unlocksDescription: 'Корпоративы сплачивают коллектив.',
                        unlocksImage: 'hrLegal-5',
                    },
                    {
                        path: 'totalitarian',
                        cost: 350000,
                        factor: 1.65,
                        unlocksName: 'Мягкая рука',
                        unlocksDescription: ' Добровольно-принудительное навязывание корпоративной культуры.',
                        unlocksImage: 'hrDark-3',
                    },
                ],
            },
            // УРОВЕНЬ 6 — нейтральный
            {
                level: 6,
                cost: 500000,
                factor: 1.7,
                unlocksName: 'Хедхантинг',
                unlocksDescription: 'Переманиваем лучших специалистов у конкурентов.',
                unlocksImage: 'hr-5',
            },
            // УРОВЕНЬ 7 — ВЫБОР
            {
                level: 7,
                branch: [
                    {
                        path: 'liberal',
                        cost: 750000,
                        factor: 1.8,
                        unlocksName: 'Открытая культура',
                        unlocksDescription: 'Сотрудники открыто критикуют недочёты. Чужое мнение не осуждается.',
                        unlocksImage: 'hrLegal-2',
                    },
                    {
                        path: 'totalitarian',
                        cost: 750000,
                        factor: 1.85,
                        unlocksName: 'Внутренняя разведка',
                        unlocksDescription: 'Организованная сеть доносчиков. У стен появились уши.',
                        unlocksImage: 'hrDark-1',
                    },
                ],
            },
            // УРОВЕНЬ 8 — нейтральный
            {
                level: 8,
                cost: 1000000,
                factor: 1.9,
                unlocksName: 'Корпоративный университет',
                unlocksDescription: 'Внутреннее обучение сотрудников.',
                unlocksImage: 'hr-2',
            },
            // УРОВЕНЬ 9 — ВЫБОР
            {
                level: 9,
                branch: [
                    {
                        path: 'liberal',
                        cost: 1500000,
                        factor: 2.0,
                        unlocksName: 'Свобода и доверие',
                        unlocksDescription: 'Гибкий график, удалёнка, отсутствие надзора.',
                        unlocksImage: 'hrLegal-3',
                    },
                    {
                        path: 'totalitarian',
                        cost: 1500000,
                        factor: 2.1,
                        unlocksName: 'Надзор и контроль',
                        unlocksDescription: 'Рабочий график строго регламентирован. На удалёнке не проследить за сотрудниками.',
                        unlocksImage: 'hrDark-4',
                    },
                ],
            },
            // УРОВЕНЬ 10 — ФИНАЛЬНЫЙ ВЫБОР
            {
                level: 10,
                branch: [
                    {
                        path: 'liberal',
                        cost: 10000000,
                        factor: 2.5,
                        unlocksName: 'Свободный коллектив',
                        unlocksDescription: 'Люди работают не из страха, а из вдохновения.',
                        unlocksImage: 'hrLegal-4',
                    },
                    {
                        path: 'totalitarian',
                        cost: 10000000,
                        factor: 2.6,
                        unlocksName: 'Тоталитарный коллектив',
                        unlocksDescription: 'Жёсткая вертикаль власти, где подавляется любая личная автономия.',
                        unlocksImage: 'hrDark-5',
                    },
                ],
            },
        ],
    },

    // ==================== IT-ОТДЕЛ ====================
    {
        id: 'it',
        name: 'IT',
        imagePath: 'it',
        description: 'Обеспечивает анализ и защиту данных.',
        maxLevel: 10,
        levels: [
            // УРОВЕНЬ 1 — линейный
            {
                level: 1,
                cost: 1000,
                factor: 1.25,
                unlocksName: 'Электронный документооборот',
                unlocksDescription: 'Проще, чем бегать за подписью по кабинетам.',
                unlocksImage: 'it-1',
            },
            // УРОВЕНЬ 2 — линейный
            {
                level: 2,
                cost: 10000,
                factor: 1.35,
                unlocksName: 'Внедрение WMS',
                unlocksDescription: 'Автоматизация складской логистики увеличивает прибыль.',
                unlocksImage: 'it-2',
            },
            // УРОВЕНЬ 3 — ВЫБОР
            {
                level: 3,
                branch: [
                    {
                        path: 'liberal',
                        cost: 50000,
                        factor: 1.4,
                        unlocksName: 'Open source аналитика',
                        unlocksDescription: 'Позволяет находить и решать проблемы в системе. Данные открыты для всех отделов.',
                        unlocksImage: 'itLegal-1',
                    },
                    {
                        path: 'totalitarian',
                        cost: 50000,
                        factor: 1.45,
                        unlocksName: 'Скрытый сбор данных',
                        unlocksDescription: 'Каждый шаг сотрудника записан в базу. Ничего личного — только метрики.',
                        unlocksImage: 'itDark-1',
                    },
                ],
            },
            // УРОВЕНЬ 4 — линейный
            {
                level: 4,
                cost: 150000,
                factor: 1.5,
                unlocksName: 'Изолированное резервное копирование',
                unlocksDescription: 'Защищает компанию от кибератак и вирусов-вымогателей.',
                unlocksImage: 'it-3',
            },
            // УРОВЕНЬ 5 — ВЫБОР
            {
                level: 5,
                branch: [
                    {
                        path: 'liberal',
                        cost: 350000,
                        factor: 1.6,
                        unlocksName: 'Кибергигиена',
                        unlocksDescription: 'Учим сотрудников не кликать по сомнительным ссылкам.',
                        unlocksImage: 'itLegal-2',
                    },
                    {
                        path: 'totalitarian',
                        cost: 350000,
                        factor: 1.65,
                        unlocksName: 'Цифровой надзор',
                        unlocksDescription: 'Мониторинг цифрового следа сотрудников в сети.',
                        unlocksImage: 'itDark-2',
                    },
                ],
            },
            // УРОВЕНЬ 6 — линейный
            {
                level: 6,
                cost: 500000,
                factor: 1.7,
                unlocksName: 'Криптография',
                unlocksDescription: 'Все корпоративные данные шифруются.',
                unlocksImage: 'it-4',
            },
            // УРОВЕНЬ 7 — ВЫБОР
            {
                level: 7,
                branch: [
                    {
                        path: 'liberal',
                        cost: 750000,
                        factor: 1.8,
                        unlocksName: 'Открытые API',
                        unlocksDescription: 'Интеграция с внешними сервисами. Данные доступны партнёрам и клиентам.',
                        unlocksImage: 'itLegal-3',
                    },
                    {
                        path: 'totalitarian',
                        cost: 750000,
                        factor: 1.85,
                        unlocksName: 'Взлом конкурентов',
                        unlocksDescription: 'Лучшая защита — это нападение. А лучшая атака — незаметная.',
                        unlocksImage: 'itDark-3',
                    },
                ],
            },
            // УРОВЕНЬ 8 — линейный
            {
                level: 8,
                cost: 1000000,
                factor: 1.9,
                unlocksName: 'Облачные вычисления',
                unlocksDescription: 'Данные компании больше не в подвале.',
                unlocksImage: 'it-5',
            },
            // УРОВЕНЬ 9 — ВЫБОР
            {
                level: 9,
                branch: [
                    {
                        path: 'liberal',
                        cost: 1500000,
                        factor: 2.0,
                        unlocksName: 'ИИ-ассистент',
                        unlocksDescription: 'Нейросеть помогает сотрудникам в работе. Подсказывает, обучает, разгружает.',
                        unlocksImage: 'itLegal-4',
                    },
                    {
                        path: 'totalitarian',
                        cost: 1500000,
                        factor: 2.1,
                        unlocksName: 'ИИ анализ поведения',
                        unlocksDescription: 'Нейросети изучают поведение сотрудников в сети. Выявляют нелояльных заранее.',
                        unlocksImage: 'itDark-4',
                    },
                ],
            },
            // УРОВЕНЬ 10 — ФИНАЛЬНЫЙ ВЫБОР
            {
                level: 10,
                branch: [
                    {
                        path: 'liberal',
                        cost: 10000000,
                        factor: 2.5,
                        unlocksName: 'Цифровая свобода',
                        unlocksDescription: 'Открытая экосистема, где данные принадлежат пользователям. Технологии служат людям, а не наоборот.',
                        unlocksImage: 'itLegal-5',
                    },
                    {
                        path: 'totalitarian',
                        cost: 10000000,
                        factor: 2.6,
                        unlocksName: 'Система корпоративных баллов',
                        unlocksDescription: 'Введение социального рейтинга сотрудников. Каждый поступок влияет на премию.',
                        unlocksImage: 'itDark-5',
                    },
                ],
            },
        ],
    },

    // ==================== ОХРАНА ТРУДА ====================
    {
        id: 'laborProt',
        name: 'Охрана труда',
        imagePath: 'laborProt',
        description: 'Обеспечивает безопасные условия труда для работников.',
        maxLevel: 10,
        levels: [
            // УРОВЕНЬ 1 — линейный
            {
                level: 1,
                cost: 1000,
                factor: 1.25,
                unlocksName: 'Инструктажи',
                unlocksDescription: 'Информируют работников. Введение инструктажей сокращает травматизацию.',
                unlocksImage: 'laborProt-1',
            },
            // УРОВЕНЬ 2 — линейный
            {
                level: 2,
                cost: 10000,
                factor: 1.35,
                unlocksName: 'СИЗ',
                unlocksDescription: 'Защита персонала от опасных и вредных производственных факторов.',
                unlocksImage: 'laborProt-2',
            },
            // УРОВЕНЬ 3 — ВЫБОР
            {
                level: 3,
                branch: [
                    {
                        path: 'liberal',
                        cost: 50000,
                        factor: 1.4,
                        unlocksName: 'Оценка рисков',
                        unlocksDescription: 'Выявление опасностей на производстве. Честно фиксируем всё, что может навредить людям.',
                        unlocksImage: 'laborProtLegal-1',
                    },
                    {
                        path: 'totalitarian',
                        cost: 50000,
                        factor: 1.45,
                        unlocksName: 'Сокрытие инцидентов',
                        unlocksDescription: 'Мелкие травмы не фиксируются. Меньше бумаг - меньше проблем. Для компании.',
                        unlocksImage: 'laborProtDark-1',
                    },
                ],
            },
            // УРОВЕНЬ 4 — линейный
            {
                level: 4,
                cost: 150000,
                factor: 1.5,
                unlocksName: 'Культура безопасности',
                unlocksDescription: 'Расширение социальной ответственности сотрудников.',
                unlocksImage: 'laborProt-3',
            },
            // УРОВЕНЬ 5 — ВЫБОР
            {
                level: 5,
                branch: [
                    {
                        path: 'liberal',
                        cost: 350000,
                        factor: 1.6,
                        unlocksName: 'Расширенные медосмотры',
                        unlocksDescription: 'Полное обследование здоровья. Находим проблемы до того, как они станут трагедией.',
                        unlocksImage: 'laborProtLegal-2',
                    },
                    {
                        path: 'totalitarian',
                        cost: 350000,
                        factor: 1.65,
                        unlocksName: 'Формальные медосмотры',
                        unlocksDescription: 'Быстрые тесты, чтобы допустить к работе. Всё, что не мешает работать - не проблема.',
                        unlocksImage: 'laborProtDark-2',
                    },
                ],
            },
            // УРОВЕНЬ 6 — линейный
            {
                level: 6,
                cost: 500000,
                factor: 1.7,
                unlocksName: 'Журнал травматизма',
                unlocksDescription: 'Написан кровью сотрудников.',
                unlocksImage: 'laborProt-4',
            },
            // УРОВЕНЬ 7 — ВЫБОР
            {
                level: 7,
                branch: [
                    {
                        path: 'liberal',
                        cost: 750000,
                        factor: 1.8,
                        unlocksName: 'ИИ-оценка рисков',
                        unlocksDescription: 'ИИ анализирует данные журналов травматизма и выдаёт инструкции по избежанию повторения подобных случаев.',
                        unlocksImage: 'laborProtLegal-3',
                    },
                    {
                        path: 'totalitarian',
                        cost: 750000,
                        factor: 1.85,
                        unlocksName: 'Нейро-дисциплина',
                        unlocksDescription: 'ИИ анализирует будущие нарушения исходя из анализа профилей сотрудников и заранее выносит предупреждения.',
                        unlocksImage: 'laborProtDark-3',
                    },
                ],
            },
            // УРОВЕНЬ 8 — линейный
            {
                level: 8,
                cost: 1000000,
                factor: 1.9,
                unlocksName: 'Вентиляция, освещение, эргономика',
                unlocksDescription: 'Сокращение вредных производственных факторов.',
                unlocksImage: 'laborProt-5',
            },
            // УРОВЕНЬ 9 — ВЫБОР
            {
                level: 9,
                branch: [
                    {
                        path: 'liberal',
                        cost: 1500000,
                        factor: 2.0,
                        unlocksName: 'Страхование сотрудников',
                        unlocksDescription: 'Полисы для всех. Если что-то случится, сотрудник получит страховую компенсацию.',
                        unlocksImage: 'laborProtLegal-4',
                    },
                    {
                        path: 'totalitarian',
                        cost: 1500000,
                        factor: 2.1,
                        unlocksName: 'Иммунитет корпорации',
                        unlocksDescription: 'Любое ЧП списывается на форс-мажор.',
                        unlocksImage: 'laborProtDark-4',
                    },
                ],
            },
            // УРОВЕНЬ 10 — ФИНАЛЬНЫЙ ВЫБОР
            {
                level: 10,
                branch: [
                    {
                        path: 'liberal',
                        cost: 10000000,
                        factor: 2.5,
                        unlocksName: 'Протокол «Эгида»',
                        unlocksDescription: 'При аварии приоритет - спасение сотрудников. Люди дороже оборудования.',
                        unlocksImage: 'laborProtLegal-5',
                    },
                    {
                        path: 'totalitarian',
                        cost: 10000000,
                        factor: 2.6,
                        unlocksName: 'Протокол «Живой щит»',
                        unlocksDescription: 'Оборудование дороже людей. При аварии приоритет - сохранить технику и товар.',
                        unlocksImage: 'laborProtDark-5',
                    },
                ],
            },
        ],
    },

    // ==================== ОТДЕЛ ПРОДАЖ ====================
    {
        id: 'marketing',
        name: 'Продажи',
        imagePath: 'marketing',
        description: 'Обеспечивает привлечение и удержание клиентов.',
        maxLevel: 10,
        levels: [
            // УРОВЕНЬ 1 — линейный
            {
                level: 1,
                cost: 1000,
                factor: 1.25,
                unlocksName: 'Холодные звонки',
                unlocksDescription: 'Прощупывание покупателей. Главное — не дать им положить трубку.',
                unlocksImage: 'marketing-1',
            },
            // УРОВЕНЬ 2 — линейный
            {
                level: 2,
                cost: 10000,
                factor: 1.35,
                unlocksName: 'Удержание клиентов',
                unlocksDescription: 'Акции, скидки постоянным клиентам, распродажи.',
                unlocksImage: 'marketing-2',
            },
            // УРОВЕНЬ 3 — ВЫБОР
            {
                level: 3,
                branch: [
                    {
                        path: 'legal',
                        cost: 50000,
                        factor: 1.4,
                        unlocksName: 'Репутация',
                        unlocksDescription: 'Высокое качество услуг, гарантии безопасного хранения.',
                        unlocksImage: 'marketingLegal-1',
                    },
                    {
                        path: 'dark',
                        cost: 50000,
                        factor: 1.45,
                        unlocksName: 'Спам-рассылки',
                        unlocksDescription: 'Почтовый ящик стал полем битвы. И мы наступаем.',
                        unlocksImage: 'marketingDark-1',
                    },
                ],
            },
            // УРОВЕНЬ 4 — линейный
            {
                level: 4,
                cost: 150000,
                factor: 1.5,
                unlocksName: 'Имя на рынке',
                unlocksDescription: 'Годы репутации позволили завоевать хорошее имя.',
                unlocksImage: 'marketing-3',
            },
            // УРОВЕНЬ 5 — ВЫБОР
            {
                level: 5,
                branch: [
                    {
                        path: 'legal',
                        cost: 350000,
                        factor: 1.6,
                        unlocksName: 'Программы лояльности',
                        unlocksDescription: 'Бонусные карты, кэшбэк, подарки, акции.',
                        unlocksImage: 'marketingLegal-2',
                    },
                    {
                        path: 'dark',
                        cost: 350000,
                        factor: 1.65,
                        unlocksName: 'Агрессивный маркетинг',
                        unlocksDescription: 'Перенимаем опыт рекламы у онлайн казино.',
                        unlocksImage: 'marketingDark-2',
                    },
                ],
            },
            // УРОВЕНЬ 6 — линейный
            {
                level: 6,
                cost: 500000,
                factor: 1.7,
                unlocksName: 'Маркетинговая аналитика',
                unlocksDescription: 'Изучаем спрос и корректируем ассортимент.',
                unlocksImage: 'marketing-4',
            },
            // УРОВЕНЬ 7 — ВЫБОР
            {
                level: 7,
                branch: [
                    {
                        path: 'legal',
                        cost: 750000,
                        factor: 1.8,
                        unlocksName: 'Партнёрские программы',
                        unlocksDescription: 'Честное сотрудничество с другими брендами. Взаимная выгода.',
                        unlocksImage: 'marketingLegal-3',
                    },
                    {
                        path: 'dark',
                        cost: 750000,
                        factor: 1.85,
                        unlocksName: 'Таргетированная реклама',
                        unlocksDescription: 'Алгоритмы знают, что вы купите завтра. И предлагают это сегодня.',
                        unlocksImage: 'marketingDark-3',
                    },
                ],
            },
            // УРОВЕНЬ 8 — линейный
            {
                level: 8,
                cost: 1000000,
                factor: 1.9,
                unlocksName: 'Клиентский сервис',
                unlocksDescription: 'Поддержка 24/7, возврат без вопросов.',
                unlocksImage: 'marketing-5',
            },
            // УРОВЕНЬ 9 — ВЫБОР
            {
                level: 9,
                branch: [
                    {
                        path: 'legal',
                        cost: 1500000,
                        factor: 2.0,
                        unlocksName: 'ИИ-Консультант',
                        unlocksDescription: 'Нейросеть подбирает клиенту идеальный товар. Честно и без давления.',
                        unlocksImage: 'marketingLegal-4',
                    },
                    {
                        path: 'dark',
                        cost: 1500000,
                        factor: 2.1,
                        unlocksName: 'ИИ-Продавец',
                        unlocksDescription: 'Искусственный интеллект продавливает покупку. Вы покупаете, даже не понимая почему.',
                        unlocksImage: 'marketingDark-4',
                    },
                ],
            },
            // УРОВЕНЬ 10 — ФИНАЛЬНЫЙ ВЫБОР
            {
                level: 10,
                branch: [
                    {
                        path: 'legal',
                        cost: 10000000,
                        factor: 2.5,
                        unlocksName: 'Империя доверия',
                        unlocksDescription: 'Клиенты возвращаются сами и приводят друзей. Репутация - главный актив.',
                        unlocksImage: 'marketingLegal-5',
                    },
                    {
                        path: 'dark',
                        cost: 10000000,
                        factor: 2.6,
                        unlocksName: 'Глобальная монополия',
                        unlocksDescription: 'Если вы не покупаете у нас, вы не покупаете нигде.',
                        unlocksImage: 'marketingDark-5',
                    },
                ],
            },
        ],
    },

    // ==================== ТЕХНИЧЕСКИЙ ОТДЕЛ ====================
    {
        id: 'repair',
        name: 'Тех отдел',
        imagePath: 'repair',
        description: 'Обеспечивает ремонт техники.',
        maxLevel: 10,
        levels: [
            {
                level: 1,
                cost: 1000,
                factor: 1.25,
                unlocksName: 'Базовый набор',
                unlocksDescription: 'Синяя изолента и WD-40 - must have.',
                unlocksImage: 'repair-1',
            },
            {
                level: 2,
                cost: 10000,
                factor: 1.35,
                unlocksName: 'Ящик инструментов',
                unlocksDescription: 'Первые серьезные шаги в развитии отдела.',
                unlocksImage: 'repair-2',
            },
            {
                level: 3,
                cost: 50000,
                factor: 1.4,
                unlocksName: 'Слесарь Василий',
                unlocksDescription: 'Появление серьезных специалистов в тех отделе.',
                unlocksImage: 'repair-3',
            },
            {
                level: 4,
                cost: 150000,
                factor: 1.5,
                unlocksName: 'Журнал поломок',
                unlocksDescription: 'Записываем всё, что сломалось. И всё, что мы сломали, пока чинили.',
                unlocksImage: 'repair-4',
            },
            {
                level: 5,
                cost: 350000,
                factor: 1.6,
                unlocksName: 'Инвентаризация инструмента',
                unlocksDescription: 'Введение контроля по инструменту и оснастке.',
                unlocksImage: 'repair-5',
            },
            {
                level: 6,
                cost: 500000,
                factor: 1.7,
                unlocksName: 'Быстрый ремонт',
                unlocksDescription: 'Нет ничего более постоянного, чем временное решение.',
                unlocksImage: 'repair-6',
            },
            {
                level: 7,
                cost: 750000,
                factor: 1.8,
                unlocksName: 'Регламентное ТО',
                unlocksDescription: 'Периодическое обслуживание техники увеличивает ресурс её работы.',
                unlocksImage: 'repair-7',
            },
            {
                level: 8,
                cost: 1000000,
                factor: 1.9,
                unlocksName: 'Ремонтная база',
                unlocksDescription: 'Наличие собственной базы запчастей сокращает простой техники.',
                unlocksImage: 'repair-8',
            },
            {
                level: 9,
                cost: 1500000,
                factor: 2.0,
                unlocksName: 'Модернизация',
                unlocksDescription: 'Покупка новой техники сохраняет высокую скорость работ.',
                unlocksImage: 'repair-9',
            },
            {
                level: 10,
                cost: 10000000,
                factor: 2.5,
                unlocksName: 'Разработка системы ТО и Р',
                unlocksDescription: 'Внедрение полного цикла обслуживания и ремонта.',
                unlocksImage: 'repair-10',
            }
        ],
    },

    // ==================== СЛУЖБА БЕЗОПАСНОСТИ ====================
    {
        id: 'security',
        name: 'Охрана',
        imagePath: 'security',
        description: 'Обеспечивает безопасность и сохранность порядка на складе.',
        maxLevel: 10,
        levels: [
            // УРОВЕНЬ 1 — линейный
            {
                level: 1,
                cost: 1000,
                factor: 1.25,
                unlocksName: 'Пропускные пункты',
                unlocksDescription: 'Контроль трафика транспорта и людей.',
                unlocksImage: 'security-1',
            },
            // УРОВЕНЬ 2 — линейный
            {
                level: 2,
                cost: 10000,
                factor: 1.35,
                unlocksName: 'Контроль рамп',
                unlocksDescription: 'Проверка поступающего и отправляемого товара.',
                unlocksImage: 'security-2',
            },
            // УРОВЕНЬ 3 — ВЫБОР
            {
                level: 3,
                branch: [
                    {
                        path: 'liberal',
                        cost: 50000,
                        factor: 1.4,
                        unlocksName: 'Профессиональная охрана',
                        unlocksDescription: 'Обученные сотрудники, чёткие регламенты, уважение к правам человека.',
                        unlocksImage: 'securityLegal-1',
                    },
                    {
                        path: 'totalitarian',
                        cost: 50000,
                        factor: 1.45,
                        unlocksName: 'Единый реестр лиц',
                        unlocksDescription: 'Профили всех, кто когда-либо входил на склад, внесены в базу.',
                        unlocksImage: 'securityDark-1',
                    },
                ],
            },
            // УРОВЕНЬ 4 — линейный
            {
                level: 4,
                cost: 150000,
                factor: 1.5,
                unlocksName: 'Пост охраны',
                unlocksDescription: 'Организованный центр контроля и принятия решений.',
                unlocksImage: 'security-3',
            },
            // УРОВЕНЬ 5 — ВЫБОР
            {
                level: 5,
                branch: [
                    {
                        path: 'liberal',
                        cost: 350000,
                        factor: 1.6,
                        unlocksName: 'Прозрачный досмотр',
                        unlocksDescription: 'Досмотр по протоколу, с уважением к достоинству.',
                        unlocksImage: 'securityLegal-2',
                    },
                    {
                        path: 'totalitarian',
                        cost: 350000,
                        factor: 1.65,
                        unlocksName: 'Тотальный контроль перемещений',
                        unlocksDescription: 'Мы знаем, где вы. Мы знаем, куда вы. Мы знаем, зачем вы.',
                        unlocksImage: 'securityDark-2',
                    },
                ],
            },
            // УРОВЕНЬ 6 — линейный
            {
                level: 6,
                cost: 500000,
                factor: 1.7,
                unlocksName: 'Система видеонаблюдения',
                unlocksDescription: 'Полный контроль ситуации на складе. Только для безопасности.',
                unlocksImage: 'security-4',
            },
            // УРОВЕНЬ 7 — ВЫБОР
            {
                level: 7,
                branch: [
                    {
                        path: 'liberal',
                        cost: 750000,
                        factor: 1.8,
                        unlocksName: 'Устный разбор',
                        unlocksDescription: 'Нарушение обсуждается с сотрудником лично. Без бумаг, без приказов, без следа в деле. Цель — исправить, а не наказать.',
                        unlocksImage: 'securityLegal-3',
                    },
                    {
                        path: 'totalitarian',
                        cost: 750000,
                        factor: 1.85,
                        unlocksName: 'Объяснительные',
                        unlocksDescription: 'Охрана замечает нарушение и вызывает сотрудника. Он пишет объяснительную. Бумага идёт в личное дело.',
                        unlocksImage: 'securityDark-3',
                    },
                ],
            },
            // УРОВЕНЬ 8 — линейный
            {
                level: 8,
                cost: 1000000,
                factor: 1.9,
                unlocksName: 'Кризисный центр',
                unlocksDescription: 'Единый штаб для реагирования на ЧП. Быстро, чётко, по протоколу.',
                unlocksImage: 'security-5',
            },
            // УРОВЕНЬ 9 — ВЫБОР
            {
                level: 9,
                branch: [
                    {
                        path: 'liberal',
                        cost: 1500000,
                        factor: 2.0,
                        unlocksName: 'Защита прав сотрудников',
                        unlocksDescription: 'Юристы следят, чтобы охрана не превышала полномочия. Даже по отношению к нарушителям.',
                        unlocksImage: 'securityLegal-4',
                    },
                    {
                        path: 'totalitarian',
                        cost: 1500000,
                        factor: 2.1,
                        unlocksName: 'Система поощрений за лояльность',
                        unlocksDescription: 'Сообщил о коллеге — получил премию.',
                        unlocksImage: 'securityDark-4',
                    },
                ],
            },
            // УРОВЕНЬ 10 — ФИНАЛЬНЫЙ ВЫБОР
            {
                level: 10,
                branch: [
                    {
                        path: 'liberal',
                        cost: 10000000,
                        factor: 2.5,
                        unlocksName: 'Протокол «Астрея»',
                        unlocksDescription: 'Богиня справедливости и невинности. Протокол регламентирует действия сотрудников охраны. Люди чувствуют себя в безопасности - и работают лучше.',
                        unlocksImage: 'securityLegal-5',
                    },
                    {
                        path: 'totalitarian',
                        cost: 10000000,
                        factor: 2.6,
                        unlocksName: 'Протокол «Паноптикум»',
                        unlocksDescription: 'Паноптикум это проект идеальной тюрьмы. Все на виду. Наказание следует за нарушением с автоматической точностью. Без суда, следствия и жалости.',
                        unlocksImage: 'securityDark-5',
                    },
                ],
            },
        ],
    }
] as const;