// C3: does the page's JSON-LD say it is a LOCAL business?
// The backend decides this when it crawls (scores.schema.hasLocalBusinessType);
// this is only the fallback for crawls saved before that flag existed. Keep the
// list in step with backend/scraping/schema_type.py.
const LOCAL_BUSINESS_TYPES = new Set([
  "localbusiness", "foodestablishment", "restaurant", "fastfoodrestaurant", "cafeorcoffeeshop", "barorpub", "bakery",
  "brewery", "winery", "distillery", "icecreamshop", "lodgingbusiness", "hotel", "motel", "resort", "hostel",
  "bedandbreakfast", "campground", "vacationrental", "store", "shoppingcenter", "grocerystore", "supermarket", "florist",
  "healthandbeautybusiness", "beautysalon", "hairsalon", "nailsalon", "dayspa", "healthclub", "tattooparlor",
  "medicalbusiness", "medicalclinic", "dentist", "physician", "pharmacy", "hospital", "optician", "veterinarycare",
  "legalservice", "attorney", "notary", "accountingservice", "financialservice", "bankorcreditunion", "insuranceagency",
  "realestateagent", "professionalservice", "travelagency", "employmentagency", "autorepair", "autodealer",
  "autobodyshop", "autowash", "gasstation", "motorcycledealer", "homeandconstructionbusiness", "electrician", "plumber",
  "generalcontractor", "roofingcontractor", "locksmith", "movingcompany", "housepainter", "hvacbusiness",
  "entertainmentbusiness", "sportsactivitylocation", "golfcourse", "childcare", "selfstorage", "drycleaningorlaundry",
  "artgallery", "casino", "movietheater", "nightclub", "amusementpark", "bowlingalley", "skiresort", "stadiumorarena",
  "internetcafe", "library", "governmentoffice", "postoffice",
]);

export function hasLocalBusinessSchema(schemas: unknown): boolean {
  if (!Array.isArray(schemas)) return false;
  return schemas.some((node: any) => {
    const raw = node && typeof node === "object" ? node["@type"] : null;
    const types = Array.isArray(raw) ? raw : [raw];
    return types.some((t) => {
      if (typeof t !== "string") return false;
      const low = (t.split(/[/#:]/).pop() || "").toLowerCase();
      return LOCAL_BUSINESS_TYPES.has(low) || low.endsWith("store") || low.endsWith("restaurant");
    });
  });
}
