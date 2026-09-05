require('dotenv').config();

const connectDB = require('./db');
const PageContent = require('./models/pageContent');

async function seedPageContent() {
    try {
        await connectDB();

        const existing = await PageContent.findOne({
            page: 'home'
        });

        if (existing) {
            console.log('Home content already exists');
            process.exit(0);
        }

        await PageContent.create({
            page: 'home',

            hero: {
                title: 'רשת דפיברילטורים חכמה להצלת חיים',
                subtitle:
                    'מערכת חכמה לחיבור בין דפיברילטורים, מתנדבים ותקשורת LoRa'
            },

            lora: {
                title: 'מהי רשת LoRa?',
                description:
                    'טכנולוגיית תקשורת לטווח ארוך ובהספק נמוך המאפשרת העברת מידע גם באזורים שבהם אין חיבור סלולרי זמין.'
            },

            registration: {
                title: 'הצטרפו לרשת',
                description:
                    'ניתן להצטרף כבעלי דפיברילטור, כמשתתפי LoRa או בשילוב של שניהם.'
            }
        });

        console.log(
            'Home page content created successfully'
        );

        process.exit(0);

    } catch (error) {
        console.error(
            'Failed to seed page content:',
            error
        );

        process.exit(1);
    }
}

seedPageContent();