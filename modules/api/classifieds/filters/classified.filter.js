'use strict';

function ClassifiedFilter(req) {
    var filter = {
        query: {},
        sort: {},
        skip: (req.query.skip * req.query.top) || 0,       
        take: parseInt(req.query.top) || 30
    };
  
    let sortParam = req.query.sort || 'created';
    filter.sort[sortParam] = -1;

    if (req.query) {
        if (req.query.q) {
            filter.query.title = { $regex: req.query.q, $options: 'i' };
        }

        if (req.query.category) {
            filter.query['category._id'] = req.query.category;
        }

        if (req.query.country) {
            filter.query['country.code'] = parseInt(req.query.country);
        }

        if (req.query.minPrice || req.query.maxPrice) {
            filter.query['price.value'] = {};
        }

        if (req.query.minPrice) {
            filter.query['price.value'].$gte = req.query.minPrice;
        }

        if (req.query.maxPrice) {
            filter.query['price.value'].$lte = req.query.maxPrice;
        }

        if (req.query.advertType) {
            filter.query.advertType = req.query.advertType;
        }
    }

    return filter;
}

module.exports = ClassifiedFilter;