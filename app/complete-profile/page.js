"use client";
import { Country, State } from "country-state-city";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/services/routeProtectionService";
import { useSession } from "next-auth/react";
import ChatbotController from '@/components/ChatbotController';

export default function CompleteProfile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [skillInput, setSkillInput] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    gender: "",
    country: "",
    state: "",
    domain: "",
    otherDomain: "",
    race: "",
    skills: [],
    mailId: "",
  });

  // Authentication check effect
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Fetch existing user data
  useEffect(() => {
    async function fetchUserData() {
      if (session?.user?.email) {
        try {
          const response = await fetch(`/api/get-user?email=${encodeURIComponent(session.user.email)}`);
          const data = await response.json();

          if (response.ok && data) {
            setFormData({
              username: data.username || "",
              gender: data.gender || "",
              country: data.country || "",
              state: data.state || "",
              domain: data.domain || "",
              otherDomain: data.otherDomain || "",
              race: data.race || "",
              skills: data.skills || [],
              mailId: data.mailId || session.user.email,
            });

            // If user data exists, redirect to profile page
            if (data.username) {
              router.push('/profile');
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Don't set error here as the user might be new
        }
      }
      setIsLoading(false);
    }

    fetchUserData();
  }, [session, router]);

  // Effect for email update from session
  useEffect(() => {
    if (session?.user?.email) {
      setFormData(prev => ({
        ...prev,
        mailId: session.user.email
      }));
    }
  }, [session]);

  // Scroll handling effect
  useEffect(() => {
    const handleResize = () => {
      if (document.body.scrollHeight > window.innerHeight) {
        document.body.style.overflow = "auto";
        document.documentElement.style.overflow = "auto";
      } else {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  // Countries effect
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // States effect
  useEffect(() => {
    if (formData.country) {
      setStates(State.getStatesOfCountry(formData.country));
    }
  }, [formData.country]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
        {/* <div className="text-white">Loading...</div> */}
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prevState) => ({
        ...prevState,
        skills: [...prevState.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index) => {
    setFormData((prevState) => ({
      ...prevState,
      skills: prevState.skills.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.mailId) {
      setError('No email address found. Please sign in again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Error creating user');
      }
  
      alert('Profile completed successfully!');
      router.push('/profile');
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const domains = ["web", "app", "blockchain"];
  const genders = ["male", "female", "other", "prefer not to say"];
  const races = [
    "American Indian or Alaska Native",
    "Asian",
    "Black or African American",
    "Hispanic or Latino",
    "Native Hawaiian or Other Pacific Islander",
    "White",
    "Two or More Races",
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#0D1117] flex flex-col">
        <main className="flex-grow container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <p className="text-xl text-gray-300 mb-8">
              Fill out your details to get personalized career guidance and
              unlock your potential!
            </p>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
              onKeyDown={handleKeyDown}
            >
              {/* Email display field */}
              <div>
                <label className="block text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.mailId}
                  disabled
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white opacity-70"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                  required
                >
                  <option value="" disabled hidden>
                    Select your gender
                  </option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                  required
                >
                  <option value="" disabled hidden>
                    Select your country
                  </option>
                  {countries.map((country) => (
                    <option key={country.isoCode} value={country.isoCode}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.country && (
                <div>
                  <label className="block text-gray-400 mb-2">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                    required
                  >
                    <option value="" disabled hidden>
                      Select your state
                    </option>
                    {states.map((state) => (
                      <option key={state.isoCode} value={state.isoCode}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-2">Domain</label>
                <select
                  name="domain"
                  value={formData.domain}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                  required
                >
                  <option value="" disabled hidden>
                    Select your domain
                  </option>
                  {domains.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain.charAt(0).toUpperCase() + domain.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {formData.domain === "other" && (
                <div>
                  <label className="block text-gray-400 mb-2">
                    Specify Domain
                  </label>
                  <input
                    type="text"
                    name="otherDomain"
                    value={formData.otherDomain}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-400 mb-2">Race</label>
                <select
                  name="race"
                  value={formData.race}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                  required
                >
                  <option value="" disabled hidden>
                    Select your race
                  </option>
                  {races.map((race) => (
                    <option key={race} value={race}>
                      {race}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Skills</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    className="flex-grow px-4 py-2 border border-gray-700 rounded-lg bg-[#161B22] text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {formData.skills.map((skill, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center px-4 py-2 bg-[#161B22] text-white rounded-lg"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(index)}
                          className="text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm mt-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#E31D65] to-[#FF6B2B] text-white rounded-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Creating Profile...' : 'Complete Profile'}
              </button>
            </form>
          </div>
        </main>
        <ChatbotController />
      </div>
    </ProtectedRoute>
  );
}