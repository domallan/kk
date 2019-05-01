describe("Database", function() {
  var DBconn = require('../db.js');
  var db;

  beforeEach(function() {
    db = DBconn;
  });
  describe("Users", function(){
  it("should get a list of users", function() {
    var result = db.getPeopleList();
    console.log()
    expect(result.fields[0].name).toEqual('user_id');
    });
  })
});
