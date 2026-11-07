import type { GlobalEvents, LocaleEvents, ChoiceEvents } from '../types/events.ts'

export const globalEventsList: GlobalEvents[] = [
  
    {
        id: 1,
        description: 'Введены налоговые каникулы для логистических компаний.',
        cost: 0.017,
        influence: 'positive'
    },
    {
        id: 2,
        description: 'Правительство открывает новый транспортный коридор. Время доставки сокращается.',
        cost: 0.125,
        influence: 'positive'
    },
    {
        id: 3,
        description: 'Крупный ритейлер подписывает с вами эксклюзивный контракт на год.',
        cost: 0.025,
        influence: 'positive'
    },
    {
        id: 4,
        description: 'Конкуренты уходят с рынка. Ваша доля растёт.',
        cost: 0.02,
        influence: 'positive'
    },
    {
        id: 5,
        description: 'Получен государственный грант на автоматизацию склада.',
        cost: 0.05,
        influence: 'positive'
    },
    {
        id: 6,
        description: 'Внедрена система энергосбережения. Счета за электричество снижены.',
        cost: 0.0025,
        influence: 'positive'
    },
    {
        id: 7,
        description: 'Государство субсидирует закупку новых погрузчиков. Вы получаете компенсацию.',
        cost: 0.05,
        influence: 'positive'
    },
    {
        id: 8,
        description: 'Внедрена система автоматической сортировки. Эффективность выросла, бюджет сэкономлен.',
        cost: 0.012,
        influence: 'positive'
    },
    {
        id: 9,
        description: 'Крупный интернет-магазин выбирает ваш склад для хранения товаров.',
        cost: 0.015,
        influence: 'positive'
    },
    {
        id: 10,
        description: 'Власти строят новую развязку рядом со складом. Время доставки сокращается, расходы на топливо падают.',
        cost: 0.04,
        influence: 'positive'
    },
    {
        id: 11,
        description: 'Сезонный всплеск спроса. Вы успешно реализовали остатки товаров с наценкой.',
        cost: 0.028,
        influence: 'positive'
    },
    {
        id: 12,
        description: 'Страховая компания возвращает часть премии за безаварийную работу в течение года.',
        cost: 0.075,
        influence: 'positive'
    },
    {
        id: 13,
        description: 'Внедрение системы «умный склад» на основе IoT. Снижение потерь и повышение точности учёта.',
        cost: 0.1,
        influence: 'positive'
    },
    {
        id: 14,
        description: 'Сотрудники прошли курсы повышения квалификации за счёт поставщика. Вы сэкономили на обучении.',
        cost: 0.015,
        influence: 'positive'
    },
    {
        id: 15,
        description: 'Заключён выгодный контракт на обратную логистику.',
        cost: 0.08,
        influence: 'positive'
    },
    {
        id: 16,
        description: 'Ваш склад получил сертификат «Экологический стандарт». Вы можете претендовать на субсидии.',
        cost: 0.08,
        influence: 'positive'
    },
    {
        id: 17,
        description: 'Местные власти снизили арендную плату за землю под складом в рамках программы поддержки бизнеса.',
        cost: 0.05,
        influence: 'positive'
    },
    {
        id: 18,
        description: 'Роботизированная техника окупилась раньше срока – сэкономленные средства поступают в бюджет.',
        cost: 0.03,
        influence: 'positive'
    },

    {
        id: 19,
        description: 'Ураган обрушился на регион. Часть склада повреждена.',
        cost: 0.03,
        influence: 'negative'
    },
    {
        id: 20,
        description: 'Новые таможенные пошлины на импортную технику. Расходы выросли.',
        cost: 0.02,
        influence: 'negative'
    },
    {
        id: 21,
        description: 'Мировой скачок цен на топливо. Перевозки дорожают.',
        cost: 0.04,
        influence: 'negative'
    },
    {
        id: 22,
        description: 'Группа хакеров взломала и зашифровала базу данных складского учета. Пришлось заплатить выкуп за расшифровку базы данных.',
        cost: 0.02,
        influence: 'negative'
    },
    {
        id: 23,
        description: 'Произошло возгорание легко воспламеняющихся жидкостей в зоне хранения товара. Часть склада повреждена.',
        cost: 0.03,
        influence: 'negative'
    },
    {
        id: 24,
        description: 'Из-за несоблюдения норм нагрузки на стеллажную зону произошло частичное обрушение зоны хранения. Часть склада пострадала.',
        cost: 0.01,
        influence: 'negative'
    },
    {
        id: 25,
        description: 'Произошла торговая война с соседним государством. Логистические компании попали под санкции.',
        cost: 0.03,
        influence: 'negative'
    },
    {
        id: 26,
        description: 'Произошло падение спроса на сезонные товары. Прибыль упала.',
        cost: 0.01,
        influence: 'negative'
    },
    {
        id: 27,
        description: 'Забастовка водителей. Доставка задерживается на несколько дней.',
        cost: 0.04,
        influence: 'negative'
    },
    {
        id: 28,
        description: 'Пожарная инспекция выписала крупный штраф за нарушения на складе.',
        cost: 0.02,
        influence: 'negative'
    },

];

export const localeEventsList: LocaleEvents[] = [
    {
        id: 1,
        description: ' уронил паллет при транспортировке, часть товара повреждена.',
        cost: 20,
        role: 'reachtruck',
        influence: 'negative'
    },
    {
        id: 2,
        description: ' разбил часть товара при пополнении пикинга.',
        cost: 25,
        role: 'reachtruck',
        influence: 'negative'
    },
    {
        id: 3,
        description: ' повредил стеллаж при съёме паллета с хранения.',
        cost: 15,
        role: 'reachtruck',
        influence: 'negative'
    },
    {
        id: 4,
        description: ' повредил отбойник при маневрировании.',
        cost: 50,
        role: 'reachtruck',
        influence: 'negative'
    },
    {
        id: 5,
        description: ' уронил корзину мезонина при подъёме.',
        cost: 45,
        role: 'reachtruck',
        influence: 'negative'
    },
    {
        id: 6,
        description: ' уронил корзину мусора с фасовки.',
        cost: 50,
        role: 'reachtruck',
        influence: 'negative'
    },
    {
        id: 7,
        description: ' задел длинногабаритный товар в проезде.',
        cost: 25,
        role: 'reachtruck',
        influence: 'negative'
    },

    {
        id: 8,
        description: ' предотвратил падение паллета.',
        cost: 20,
        role: 'reachtruck',
        influence: 'positive'
    },
    {
        id: 9,
        description: ' нашел потерянный паллет и закрыл недостачу.',
        cost: 25,
        role: 'reachtruck',
        influence: 'positive'
    },
    {
        id: 10,
        description: ' заметил неисправность техники, при осмотре.',
        cost: 15,
        role: 'reachtruck',
        influence: 'positive'
    },
    {
        id: 11,
        description: ' предотвратил бой товара.',
        cost: 50,
        role: 'reachtruck',
        influence: 'positive'
    },
    {
        id: 12,
        description: ' нашёл и отвез потерянный товар инспектору.',
        cost: 45,
        role: 'reachtruck',
        influence: 'positive'
    },
    {
        id: 13,
        description: ' помог закрыть уязвимость системы.',
        cost: 50,
        role: 'reachtruck',
        influence: 'positive'
    },
    {
        id: 14,
        description: ' предложил идею по оптимизации логистических процессов.',
        cost: 25,
        role: 'reachtruck',
        influence: 'positive'
    },

    {
        id: 15,
        description: ' забраковал товар при отборе.',
        cost: 20,
        role: 'picker',
        influence: 'negative'
    },
    {
        id: 16,
        description: ' повредил часть товара при маневрировании.',
        cost: 25,
        role: 'picker',
        influence: 'negative'
    },
    {
        id: 17,
        description: ' повредил стеллаж при развороте.',
        cost: 15,
        role: 'picker',
        influence: 'negative'
    },
    {
        id: 18,
        description: ' нанёс травму коллеге(Тот называл его боксовозом).',
        cost: 50,
        role: 'picker',
        influence: 'negative'
    },
    {
        id: 19,
        description: ' отобрал не тот товар.',
        cost: 45,
        role: 'picker',
        influence: 'negative'
    },
    {
        id: 20,
        description: ' отобрал бракованный товар.',
        cost: 50,
        role: 'picker',
        influence: 'negative'
    },
    {
        id: 21,
        description: ' случайно наехал на ногу коллеге.',
        cost: 25,
        role: 'picker',
        influence: 'negative'
    },

    {
        id: 22,
        description: ' обнаружил потерянный товар и отнес его инспектору.',
        cost: 20,
        role: 'picker',
        influence: 'positive'
    },
    {
        id: 23,
        description: ' помог на стикеровке, при отсутствии основной работы.',
        cost: 25,
        role: 'picker',
        influence: 'positive'
    },
    {
        id: 24,
        description: ' помог хозработникам, при отсутствии основной работы.',
        cost: 15,
        role: 'picker',
        influence: 'positive'
    },
    {
        id: 25,
        description: ' предложил улучшение техпроцесса для ускорения отбора.',
        cost: 50,
        role: 'picker',
        influence: 'positive'
    },
    {
        id: 26,
        description: ' внёс идею по оптимизации работы хозслужбы.',
        cost: 45,
        role: 'picker',
        influence: 'positive'
    },
    {
        id: 27,
        description: ' предложил изменения по улучшению работы системы.',
        cost: 50,
        role: 'picker',
        influence: 'positive'
    },
    {
        id: 28,
        description: ' повлиял на сплочение коллектива и улучшение показателей производительности.',
        cost: 25,
        role: 'picker',
        influence: 'positive'
    },
]

export const choiceEventsList: ChoiceEvents[] = [
    {
        id: 1,
        description: ' получил три проступка. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 2,
        description: ' систематически покидает рабочее место раньше времени. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 3,
        description: ' нашел уязвимость в системе и использовал ее в своих целях. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 4,
        description: ' нашел способ по майнингу хаускоинов. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 5,
        description: ' скрыл повреждение траверсы. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 6,
        description: ' систематически нарушает технику безопасности. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 7,
        description: ' скрыл повреждение техники. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 8,
        description: ' скрыл повреждение товара. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 9,
        description: ' систематически находится в стеллажной зоне без каскетки. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 10,
        description: ' систематически опаздывает на работу. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 11,
        description: ' систематически прогуливает. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 12,
        description: ' растягивает перерывы и обед. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 13,
        description: ' отказывается убирать свой ряд. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 14,
        description: ' периодически отказывается от выполнения своих непосредственных обязанностей. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    },
    {
        id: 15,
        description: ' грубит руководству. Решите, что с ним делать.',
        decisions: {
            positive: 'Простить',
            negative: 'Уволить'
        }
    }
]