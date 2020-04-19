class QueryBuilder {
  constructor(mongooseQuery, reqQuery) {
    this.mongooseQuery = mongooseQuery;
    this.reqQuery = reqQuery;
  }

  filter() {
    // BUILD QUERY
    // 1.1 Filtering
    const queryObj = { ...this.reqQuery };
    // Exclude as they are not document props rather query props
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(el => delete queryObj[el]);

    // 1.2 Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    // Replacing operators with mongoose operator

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // 2. Sorting
    if (this.reqQuery.sort) {
      // chaining methods
      const sortBy = this.reqQuery.sort.split(',').join(' ');

      this.mongooseQuery.sort(sortBy);
    } else {
      // - for descending order
      this.mongooseQuery.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // 3. Field Limiting
    if (this.reqQuery.fields) {
      const fields = this.reqQuery.fields.split(',').join(' ');
      this.mongooseQuery.select(fields);
    } else {
      // Exclude a field using "-"
      this.mongooseQuery.select('-__v');
    }
    return this;
  }

  paginate() {
    // 4. Pagination
    const page = this.reqQuery.page * 1 || 1;
    const limit = this.reqQuery.limit * 1 || 100;
    const skip = (page - 1) * limit;

    // page=1&limit=10 => 1-10, page=2&limit=10 => 11-20, page=3&limit=10 => 21-30
    this.mongooseQuery.skip(skip).limit(limit);

    // Not being considered an error
    // if (this.reqQuery.page) {
    //   const numOfTours = Tour.countDocuments();
    //   if (skip >= numOfTours) throw new Error('This page does not exist');
    // }
    return this;
  }
}
module.exports = QueryBuilder;
