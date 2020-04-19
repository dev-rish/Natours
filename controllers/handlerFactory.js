const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const QueryBuilder = require('../utils/queryBuilder');

exports.deleteOne = Model =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      throw new AppError('No document found with that ID', 404);
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return new document
      runValidators: true
    });

    if (!doc) {
      throw new AppError('No document found with that ID', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res) => {
    // const doc = new Model({});
    // doc.save();
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const doc = await query;
    if (!doc) {
      throw new AppError('No document found with that ID', 404);
    }
    return res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res) => {
    // NOTE: Below 2 lines only for reviews. (Kinnda Hack!)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const utils = new QueryBuilder(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute query
    // Final Query => query().sort().select().skip().limit()
    const docs = await utils.mongooseQuery;
    // to get query stats use explain
    // .explain();

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });
