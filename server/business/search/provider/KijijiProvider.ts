import { ProviderType } from '@business/injection/Injector'
import { IAd, IProvider } from '@business/search/provider/IProvider'
import { ExtraKijijiSearchAttribute, IKijijiSearch } from '@business/search/kijiji/KijijiSearch'
import { search as kSearch } from 'kijiji-scraper'
import { L } from '@/common/logger'
import { Str } from '@/utils/Str'
import lodash from 'lodash'

export class KijijiProvider implements IProvider<IKijijiSearch> {

  public readonly type: ProviderType = ProviderType.KIJIJI

  async processSearch(search: IKijijiSearch): Promise<IAd[]> {
    let searchParams = {
      locationId: search.locationId,
      categoryId: search.categoryId,
      sortByName: 'dateDesc',
    }

    if (search.maxPrice) {
      searchParams['maxPrice'] = search.maxPrice
    }
    if (search.minPrice) {
      searchParams['minPrice'] = search.minPrice
    }
    if (search.kijijiSearchStr) {
      searchParams['q'] = search.kijijiSearchStr.split(' ').join('+')
    }
    if (search.extraAttributes.length > 0) {
      search.extraAttributes.forEach((extraArg: ExtraKijijiSearchAttribute) => {
        const stringified = lodash.mapValues(extraArg, (value: any) => JSON.stringify(value))
        searchParams = lodash.merge(searchParams, stringified)
      })
    }
    
    let ads: IAd[] = []
    try {
      ads = await kSearch(searchParams)
      if (search.bodyMatch.length > 0) {
        ads = ads.filter((ad: IAd) => {
          return Str.containsAll(ad.description, search.bodyMatch)
        })
      }
      if (search.bodyMatchExclude.length > 0) {
        ads = ads.filter((ad: IAd) => {
          return !Str.containsOne(ad.description, search.bodyMatchExclude)
        })
        ads = ads.filter((ad: IAd) => {
          return !Str.containsOne(ad.title, search.bodyMatchExclude)
        })
      }
      if (search.addressMatch.length > 0) {
        ads = ads.filter((ad: IAd) => {
          return Str.containsOne(ad.attributes.location, search.addressMatch)
        })
      }
      if (search.availableDateAfter) {
        var filterDate = new Date(search.availableDateAfter)
        ads = ads.filter((ad: IAd) => {
          return (filterDate<ad.attributes.dateavailable)
        })
      }
      if (search.dishWasher) {
        ads = ads.filter((ad: IAd) => {
          return (ad.attributes.dishwasher)
        })
      }
      L.info(ads)
    } catch (error) {
      L.error(error, 'Problem with Kijiji')
    }
    return Promise.resolve(ads)
  }

}
