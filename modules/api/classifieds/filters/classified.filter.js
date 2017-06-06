'use strict';

function ClassifiedFilter(req) {
    var filter = {};

    if (req.query) {
        if (req.query.q) {
            filter.title = { $regex: req.query.q, $options: 'i' };
        }

        if (req.query.category) {
            filter['category._id'] = req.query.category;
        }

        if (req.query.country) {
            filter['country.code'] = parseInt(req.query.country);
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filter['price.value'] = {};
        }

        if (req.query.minPrice) {
            filter['price.value'].$gte = req.query.minPrice;
        }

        if (req.query.maxPrice) {
            filter['price.value'].$lte = req.query.maxPrice;
        }

        if (req.query.advertType) {
            filter.advertType = req.query.advertType;
        }
    }

    return filter;
}

module.exports = ClassifiedFilter;