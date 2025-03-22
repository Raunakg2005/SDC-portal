import React from 'react';
import ApplicationCard from './ApplicationCard';

const applicationData = [
  {
    id: 'UG_1',
    title: 'UG_1',
    description: 'Category: UG1 In-House Student project ( FY to LY Students) With in Department',
  },
  { 
    id: 'UG_2',
    title: 'UG_2',
    description: 'Category: UG2 In-House ( FY to LY Students) Interdisciplinary projects',
  },
  {
    id: 'UG_3_A',
    title: 'UG_3_A',
    description: 'Category: UG3 Participation in Project Competition',
  },
  {
    id: 'UG_3_B',
    title: 'UG_3_B',
    description: 'Category: UG3 Participation in Reputed Conference',
  },
  {
    id: 'PG_1',
    title: 'PG_1',
    description: 'Category: PG1 Professional Development Through Workshops / STTPs.',
  },
  {
    id: 'PG_2_A',
    title: 'PG_2_A',
    description: 'Category: PG2 Participation in Project Competition',
  },
  {
    id: 'PG_2_B',
    title: 'PG_2_B',
    description: 'Category: PG2_2 Participation in Reputed Conference',
  },
  {
    id: 'R1',
    title: 'R1',
    description: 'Category: R1 Publication in Reputed Journals/Paper/Poster presentation an Esteemed Conference/STTP/Workshop',
  },
  {
    id: 'UD_1',
    title: 'UD_1',
    description: 'Category: UD1 New Form Example',
  }
];

const ApplicationForms = () => {
  return (
    <section className="application-forms">
      <h1 className="section-title">Application Forms</h1>
      <div className="form-grid">
        {applicationData.map((application) => (
          <ApplicationCard key={application.id} {...application} />
        ))}
      </div>
      <style jsx>{`
        .application-forms {
          flex: 1;
          padding: 20px;
        }
        .section-title {
          font-size: 44px;
          font-weight: 600;
          margin-bottom: 40px;
          text-align: center;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
        }
        @media (max-width: 991px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default ApplicationForms;
