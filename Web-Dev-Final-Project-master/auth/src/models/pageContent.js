const mongoose = require('mongoose');

const pageContentSchema = new mongoose.Schema(
    {
        page: {
            type: String,
            required: true,
            unique: true
        },
        hero: {
            title: String,
            subtitle: String
        },
        lora: {
            title: String,
            description: String
        },
        registration: {
            title: String,
            description: String
        }
    },
    {
        timestamps: true
    }

);

const PageContent = mongoose.model('PageContent', pageContentSchema);

module.exports = PageContent;
