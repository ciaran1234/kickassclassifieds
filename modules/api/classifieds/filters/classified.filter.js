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
    }
   
    return filter;
}

module.exports = ClassifiedFilter;