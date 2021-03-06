import validator from 'validator';
import axios from 'axios';
import cheerio from 'cheerio';
import _ from 'lodash';

export const getVideos = async courseUrl => {
  if (validator.isURL(courseUrl)) {
    try {
      const data = await getCourseNamesAndURLS(courseUrl);
      return data;
    } catch (err) {
      throw err;
    }
  } else {
    throw new Error('Course url is not valid');
  }
};

const getCourseNamesAndURLS = async courseUrl => {
  try {
    const data = await axios.get(courseUrl);
    let lessonNames = [];
    let $ = cheerio.load(data.data);

    const courseName = $('.hero-description')[0].children[0].data;

    const html = $('#lessons-list');
    let dataArray = html
      .children('.lessons-item')
      .children()
      .toArray();

    const filterNames = dataArray.filter(
      el => el.attribs.class === 'lessons-name'
    );

    filterNames.forEach((el, idx) => {
      const videoName = el.children[0].data.replace(/[/:*?"<>|]/g, '');
      const videoNumber = idx + 1;
      lessonNames.push(`${videoNumber}. ${videoName}`);
    });

    const filterLessonUrls = dataArray.filter(
      el => el.name === 'link' && el.attribs.itemprop === 'contentUrl'
    );

    // format video download information
    const lessons = {};
    filterLessonUrls.forEach((flu, index) => {
      lessons[lessonNames[index]] = {
        name: lessonNames[index],
        url: flu.attribs.href,
        checked: true,
        progress: 'active',
        isFinished: false,
        status: {
          transferred: 0,
          total: 0,
          speed: 0,
          percentage: 0,
          remaining: 0,
        },
      };
    });

    if (_.isEmpty(lessons)) {
      throw new Error('Course url is not valid or videos are VIP only');
    }

    return { lessons, courseName };
  } catch (err) {
    throw err;
  }
};
